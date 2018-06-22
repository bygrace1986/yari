import { Subject, BehaviorSubject, Observable, merge, never, of } from 'rxjs';
import { multicast, refCount, map, filter, tap, catchError, distinctUntilChanged } from 'rxjs/operators';

export interface ReduxAction<T> {
    type: string;
    payload: T;
}

export interface ReduxReducer<T> {
    (state: T, action: ReduxAction<any>): T;
}

export interface ReduxStateChange<T> {
    oldState: T;
    newState: T;
    action: ReduxAction<any>;
}

export interface ReduxDebug<T> {
    (change: ReduxStateChange<T>): void;
}

/**
 * Lite redux store implementation.
 * Can be configured with hot and cold streams.
 * It will maintain a subscription to hot streams but will only
 * subscribe to cold streams if there is a subscriber observing state.
 * 
 * @export
 * @class ReduxStore
 * @template T 
 */
export class ReduxStore<T> {
    private readonly cache: BehaviorSubject<T>;
    private readonly internalActions = new Subject<ReduxAction<any>>();
    private readonly appliedActions = new Subject<ReduxAction<any>>();

    public readonly actions = this.appliedActions.asObservable();
    public readonly state: Observable<T>;

    /**
     * Creates an instance of ReduxStore.
     * 
     * @param {ReduxReducer<T>} reducer Changes the state based on actions.
     * @param {T} initialState Initial state.
     * @param {Observable<ReduxAction<any>>[]} coldActions that an internal subscription should not be maintained for.
     * @param {Observable<ReduxAction<any>>[]} hotActions that an internal subscription should be maintained for.
     * @param {ReduxDebug<T>} debug debug log method that can hook into state change events.
     * @memberof ReduxStore
     */
    constructor(
        private reducer: ReduxReducer<T>,
        initialState: T,
        private coldActions?: Observable<ReduxAction<any>>[],
        private hotActions?: Observable<ReduxAction<any>>[],
        private debug?: ReduxDebug<T>
    ) {
        this.coldActions = this.coldActions || [];
        this.hotActions = this.hotActions || [];
        this.cache = new BehaviorSubject<T>(initialState);
        this.state = this.createState();
        this.startHotActionStream();
        if (typeof debug === 'function') {
            const change = { oldState: null, newState: initialState, action: null } as ReduxStateChange<T>;
            debug(change);
        }
    }

    /**
     * Dispatch an action to affect state.
     * 
     * @param {ReduxAction<any>} action 
     * @memberof ReduxStore
     */
    public dispatch(action: ReduxAction<any>): void {
        this.internalActions.next(action);
    }

    /**
     * Create an observable for the given slice of state
     * and only emit values that are distinct until changed.
     * 
     * @template R 
     * @param {(state: T) => R} [selector=((state: T) => <any>state)] selector for a given slice of state.
     * @returns {Observable<R>} 
     * @memberof ReduxStore
     */
    public select<R>(
        selector: (state: T) => R = ((state: T) => <any>state)
    ): Observable<R> {
        return this.state.pipe(
            map(selector),
            distinctUntilChanged()
        );
    }

    /**
     * Create a hot stream that changes the state based on actions.
     * 
     * @private
     * @returns {void} 
     * @memberof ReduxStore
     */
    private startHotActionStream(): void {
        // isolate errors to avoid collapsing the action stream
        const hotActions = this.hotActions.map((hotAction) => hotAction.pipe(this.skipError()));
        const state = merge(
            this.internalActions,
            ...hotActions
        ).pipe(
            this.reduce()
        ).subscribe((state) => {
            this.cache.next(state);
        });
    }

    /**
     * Create a stream that caches and multi-casts the state.
     * It will maintain a single inner subscription till there
     * are no external subscribers. However the cache will persist
     * between the stream being torn down because our subject factory
     * in the multi-cast operator resuses a ReplaySubject.
     * 
     * @private
     * @returns {Observable<T>} 
     * @memberof ReduxStore
     */
    private createState(): Observable<T> {
        // isolate errors to avoid collapsing the state stream
        const coldActions = this.coldActions.map((coldAction) => coldAction.pipe(this.skipError()));
        return merge(
            ...coldActions,
            // use never to keep the stream open even if there aren't any open cold actions
            never()
        ).pipe(
            this.reduce(),
            // will share and replay and maintain cache between the stream going from hot to cold to hot
            multicast(() => this.cache),
            refCount()
        )
    }

    /**
     * Supress errors while keeping the stream open.
     * 
     * @private
     * @returns {<A>(source: Observable<A>) => Observable<A>} 
     * @memberof ReduxStore
     */
    private skipError(): <A>(source: Observable<A>) => Observable<A> {
        // unique object to use for a ref check to filter out exceptions
        const exception = {};
        return <A>(source: Observable<A>): Observable<A> => {
            return source.pipe(
                catchError((err) => of(exception)),
                filter((x) => x !== exception)
            ) as Observable<A>;
        };
    };

    /**
     * Wrap up the state reduction logic in an operator for sharing.
     * Side-effect: emits actions that are applied to state (appliedActions).
     * Side-effect: emits state changes (debug).
     * Emits stat only if it changes.
     * 
     * @private
     * @returns {(source: Observable<ReduxAction<any>>) => Observable<T>} 
     * @memberof ReduxStore
     */
    private reduce(): (source: Observable<ReduxAction<any>>) => Observable<T> {
        let oldState: T;
        let lastAction: ReduxAction<any>;
        
        return (source: Observable<ReduxAction<any>>): Observable<T> => {
            return source.pipe(
                tap((action: ReduxAction<any>) => {
                    // emit actions as a side effect so that cold actions aren't emitted if there isn't a subscriber
                    this.appliedActions.next(action)
                    // save inputs for logging
                    oldState = this.cache.value;
                    lastAction = action;
                }),
                // map rather than scan so we can share the aggregate with multiple streams
                map((action: ReduxAction<any>) => this.reducer(this.cache.value, action)),
                // log the state change
                tap((state: T) => {
                    if (typeof this.debug === 'function') {
                        const change = { oldState, newState: state, action: lastAction } as ReduxStateChange<T>;
                        this.debug(change);
                    }
                }),
                // same effect as distinctUntilChanged but shares with multiple streams
                filter(x => x !== this.cache.value)
            );
        };
    }
}