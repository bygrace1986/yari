import { Subject, Subscription } from 'rxjs';

import { ReduxStore, ReduxStateChange, ReduxDebug, ReduxAction } from '../redux-store';

interface Model {
    id: number;
    value: string;
}

const mockReducer = (state: Model, action: ReduxAction<any>) => ({ ...action.payload });

describe('ReduxStore', () => {
    describe('initial subscription', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const stateResponses = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const sut = new ReduxStore<Model>((s, a) => s, initialState, null, null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => { stateResponses.push(state); });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state', () => {
            expect(stateResponses.length).toEqual(1);
            expect(stateResponses[0].id).toEqual(initialState.id);
        });
        it('should not emit actions', () => {
            expect(actionResponses.length).toEqual(0);
        });
        it('should emit state change for initial state', () => {
            expect(debugResponses.length).toEqual(1);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
        });
    });
    describe('initial subscription, dispatch, second subscription', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[][] = [[], []];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, null, debug);

        // act
        beforeAll((done) => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses[0].push(state);
                switch (stateResponses[0].length) {
                    case 1:
                        setTimeout(() => {
                            sut.dispatch(action);
                        }, 0);
                        break;
                    case 2:
                        setTimeout(() => {
                            stateSub.add(sut.state.subscribe((state) => {
                                stateResponses[1].push(state);
                                setTimeout(() => {
                                    done();
                                }, 0);
                            }));
                        }, 0);
                        break;
                }
            });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state and state change to first subscriber', () => {
            expect(stateResponses[0].length).toEqual(2);
            expect(stateResponses[0][0].id).toEqual(initialState.id);
            expect(stateResponses[0][1].id).toEqual(updatedState.id);
        });
        it('should emit cache to second subscriber', () => {
            expect(stateResponses[1].length).toEqual(1);
            expect(stateResponses[1][0].id).toEqual(updatedState.id);
            expect(stateResponses[1][0]).toBe(stateResponses[0][1]);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('initial subscription, dispatch, unsubscribe, second subscription', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[][] = [[], []];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, null, debug);

        // act
        beforeAll((done) => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses[0].push(state);
                switch (stateResponses[0].length) {
                    case 1:
                        setTimeout(() => {
                            sut.dispatch(action);
                        }, 0);
                        break;
                    case 2:
                        setTimeout(() => {
                            stateSub.unsubscribe();
                            stateSub = sut.state.subscribe((state) => {
                                stateResponses[1].push(state);
                                setTimeout(() => {
                                    done();
                                }, 0);
                            });
                        }, 0);
                        break;
                }
            });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state and state change to first subscriber', () => {
            expect(stateResponses[0].length).toEqual(2);
            expect(stateResponses[0][0].id).toEqual(initialState.id);
            expect(stateResponses[0][1].id).toEqual(updatedState.id);
        });
        it('should emit cache to second subscriber', () => {
            expect(stateResponses[1].length).toEqual(1);
            expect(stateResponses[1][0].id).toEqual(updatedState.id);
            expect(stateResponses[1][0]).toBe(stateResponses[0][1]);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('initial subscription, second subscription, dispatch', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[][] = [[], []];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses[0].push(state);
            });
            stateSub.add(sut.state.subscribe((state) => {
                stateResponses[1].push(state);
            }));
            sut.dispatch(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state and state change to first subscriber', () => {
            expect(stateResponses[0].length).toEqual(2);
            expect(stateResponses[0][0].id).toEqual(initialState.id);
            expect(stateResponses[0][1].id).toEqual(updatedState.id);
        });
        it('should emit initial state and state change to second subscriber', () => {
            expect(stateResponses[1].length).toEqual(2);
            expect(stateResponses[1][0].id).toEqual(initialState.id);
            expect(stateResponses[1][1].id).toEqual(updatedState.id);
            expect(stateResponses[1][1]).toBe(stateResponses[0][1]);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('initial subscription, second subscription, dispatch hot action', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[][] = [[], []];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const hotAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, [hotAction.asObservable()], debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses[0].push(state);
            });
            stateSub.add(sut.state.subscribe((state) => {
                stateResponses[1].push(state);
            }));
            hotAction.next(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state and state change to first subscriber', () => {
            expect(stateResponses[0].length).toEqual(2);
            expect(stateResponses[0][0].id).toEqual(initialState.id);
            expect(stateResponses[0][1].id).toEqual(updatedState.id);
        });
        it('should emit initial state and state change to second subscriber', () => {
            expect(stateResponses[1].length).toEqual(2);
            expect(stateResponses[1][0].id).toEqual(initialState.id);
            expect(stateResponses[1][1].id).toEqual(updatedState.id);
            expect(stateResponses[1][1]).toBe(stateResponses[0][1]);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('initial subscription, second subscription, dispatch cold action', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[][] = [[], []];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const coldAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, [coldAction.asObservable()], null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses[0].push(state);
            });
            stateSub.add(sut.state.subscribe((state) => {
                stateResponses[1].push(state);
            }));
            coldAction.next(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state and state change to first subscriber', () => {
            expect(stateResponses[0].length).toEqual(2);
            expect(stateResponses[0][0].id).toEqual(initialState.id);
            expect(stateResponses[0][1].id).toEqual(updatedState.id);
        });
        it('should emit initial state and state change to second subscriber', () => {
            expect(stateResponses[1].length).toEqual(2);
            expect(stateResponses[1][0].id).toEqual(initialState.id);
            expect(stateResponses[1][1].id).toEqual(updatedState.id);
            expect(stateResponses[1][1]).toBe(stateResponses[0][1]);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('dispatch, subscribe', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            sut.dispatch(action);
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit updated state from cache to subscriber', () => {
            expect(stateResponses.length).toEqual(1);
            expect(stateResponses[0].id).toEqual(updatedState.id);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('dispatch hot action, subscribe', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const hotAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, [hotAction.asObservable()], debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            hotAction.next(action);
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit updated state from cache to subscriber', () => {
            expect(stateResponses.length).toEqual(1);
            expect(stateResponses[0].id).toEqual(updatedState.id);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('dispatch cold action, subscribe', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const coldAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, [coldAction.asObservable()], null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            coldAction.next(action);
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state to the subscriber', () => {
            expect(stateResponses.length).toEqual(1);
            expect(stateResponses[0].id).toEqual(initialState.id);
        });
        it('should not emit the action', () => {
            expect(actionResponses.length).toEqual(0);
        });
        it('should emit state change for initial state', () => {
            expect(debugResponses.length).toEqual(1);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
        });
    });
    describe('dispatch unknown action, subscribe', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const sut = new ReduxStore<Model>((state, action) => state, initialState, null, null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
            sut.dispatch(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state to the subscriber', () => {
            expect(stateResponses.length).toEqual(1);
            expect(stateResponses[0].id).toEqual(initialState.id);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState).toEqual(initialState);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('subscribe, dispatch x 3', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const actions = [
            <ReduxAction<any>>{ type: 'Update', payload: { id: 1 } as Model },
            <ReduxAction<any>>{ type: 'Update', payload: { id: 2 } as Model },
            <ReduxAction<any>>{ type: 'Update', payload: { id: 3 } as Model }
        ];
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
            actions.forEach((action) => { sut.dispatch(action); });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state and all state updates', () => {
            expect(stateResponses.length).toEqual(1 + actions.length);
            expect(stateResponses[0].id).toEqual(initialState.id);
            actions.forEach((action, i) => {
                expect(stateResponses[i + 1].id).toEqual(action.payload.id);
            });
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(actions.length);
            actions.forEach((action, i) => {
                expect(actionResponses[i]).toBe(action);
            });
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(1 + actions.length);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            actions.forEach((action, i) => {
                const debugResponse = debugResponses[i + 1];
                expect(debugResponse.oldState.id).toBe(i === 0 ? initialState.id : actions[i - 1].payload.id);
                expect(debugResponse.newState.id).toEqual(action.payload.id);
                expect(debugResponse.action).toBe(action);
            });
        });
    });
    describe('subscribe, cold action complete, dispatch', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const coldAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, [coldAction.asObservable()], null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
            coldAction.complete();
            sut.dispatch(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial and updated state from cache to subscriber', () => {
            expect(stateResponses.length).toEqual(2);
            expect(stateResponses[0].id).toEqual(initialState.id);
            expect(stateResponses[1].id).toEqual(updatedState.id);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('subscribe, cold action error, dispatch', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const coldAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, [coldAction.asObservable()], null, debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
            coldAction.error(new Error('my bad'));
            sut.dispatch(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial and updated state from cache to subscriber', () => {
            expect(stateResponses.length).toEqual(2);
            expect(stateResponses[0].id).toEqual(initialState.id);
            expect(stateResponses[1].id).toEqual(updatedState.id);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('subscribe, hot action complete, dispatch', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const hotAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, [hotAction.asObservable()], debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
            hotAction.complete();
            sut.dispatch(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial and updated state from cache to subscriber', () => {
            expect(stateResponses.length).toEqual(2);
            expect(stateResponses[0].id).toEqual(initialState.id);
            expect(stateResponses[1].id).toEqual(updatedState.id);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('subscribe, hot action error, dispatch', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = { id: 0 } as Model;
        const updatedState = { id: 1 } as Model;
        const action = <ReduxAction<any>>{ type: 'Update', payload: updatedState };
        const stateResponses: Model[] = [];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model>[] = [];
        const debug: ReduxDebug<Model> = (change: ReduxStateChange<Model>) => { debugResponses.push(change); };
        const hotAction = new Subject<ReduxAction<any>>();
        const sut = new ReduxStore<Model>(mockReducer, initialState, null, [hotAction.asObservable()], debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.state.subscribe((state) => {
                stateResponses.push(state);
            });
            hotAction.error(new Error('my bad'));
            sut.dispatch(action);
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial and updated state from cache to subscriber', () => {
            expect(stateResponses.length).toEqual(2);
            expect(stateResponses[0].id).toEqual(initialState.id);
            expect(stateResponses[1].id).toEqual(updatedState.id);
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(1);
            expect(actionResponses[0]).toBe(action);
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(2);
            expect(debugResponses[0].newState.id).toEqual(initialState.id);
            expect(debugResponses[1].oldState.id).toEqual(initialState.id);
            expect(debugResponses[1].newState.id).toEqual(updatedState.id);
            expect(debugResponses[1].action).toBe(action);
        });
    });
    describe('subscribe to slice, dispatch for slices', () => {
        // arrange
        let actionSub: Subscription;
        let stateSub: Subscription;
        const initialState = [];
        const actions = [
            <ReduxAction<any>>{ type: 'Add', payload: <Model> { id: 1, value: 'initial' } },
            <ReduxAction<any>>{ type: 'Add', payload: <Model> { id: 2, value: 'initial' } },
            <ReduxAction<any>>{ type: 'Update', payload: <Model> { id: 1, value: 'updated' } },
            <ReduxAction<any>>{ type: 'Update', payload: <Model> { id: 2, value: 'updated' } }
        ];
        const stateResponses: Model[][] = [[],[]];
        const actionResponses: ReduxAction<any>[] = [];
        const debugResponses: ReduxStateChange<Model[]>[] = [];
        const debug: ReduxDebug<Model[]> = (change: ReduxStateChange<Model[]>) => { debugResponses.push(change); };
        const hotAction = new Subject<ReduxAction<any>>();
        const reducer = (state: Model[], action: ReduxAction<Model>): Model[] => {
            return [...state.filter(x => x.id !== action.payload.id), <Model>{ ...action.payload }];
        };
        const sut = new ReduxStore<Model[]>(reducer, initialState, null, [hotAction.asObservable()], debug);

        // act
        beforeAll(() => {
            actionSub = sut.actions.subscribe((action) => { actionResponses.push(action); });
            stateSub = sut.select(x => x.find(y => y.id === 1)).subscribe((state) => {
                stateResponses[0].push(state);
            });
            stateSub.add(sut.select(x => x.find(y => y.id === 2)).subscribe((state) => {
                stateResponses[1].push(state);
            }));
            actions.forEach((action) => { sut.dispatch(action); });
        });

        // clean-up
        afterAll(() => {
            actionSub.unsubscribe();
            stateSub.unsubscribe();
        });

        // assert
        it('should emit initial state and updates for slice(1)', () => {
            expect(stateResponses[0].length).toEqual(3);
            expect(stateResponses[0][0]).toBeUndefined();
            expect(stateResponses[0][1].id).toEqual(1);
            expect(stateResponses[0][1].value).toEqual('initial');
            expect(stateResponses[0][2].id).toEqual(1);
            expect(stateResponses[0][2].value).toEqual('updated');
        });
        it('should emit initial state and updates for slice(2)', () => {
            expect(stateResponses[1].length).toEqual(3);
            expect(stateResponses[1][0]).toBeUndefined();
            expect(stateResponses[1][1].id).toEqual(2);
            expect(stateResponses[1][1].value).toEqual('initial');
            expect(stateResponses[1][2].id).toEqual(2);
            expect(stateResponses[1][2].value).toEqual('updated');
        });
        it('should emit the action', () => {
            expect(actionResponses.length).toEqual(actions.length);
            actions.forEach((action, i) => {
                expect(actionResponses[i]).toBe(action);
            });
        });
        it('should emit state change for initial state and the result of the action', () => {
            expect(debugResponses.length).toEqual(1 + actions.length);
            expect(debugResponses[0].newState).toBe(initialState);
            let debugResponse = debugResponses[1];
            expect(debugResponse.oldState).toBe(initialState);
            expect(debugResponse.newState.length).toEqual(1);
            expect(debugResponse.newState[0].id).toEqual(1);
            expect(debugResponse.action).toBe(actions[0]);
            debugResponse = debugResponses[2];
            expect(debugResponse.oldState).toBe(debugResponses[1].newState);
            expect(debugResponse.newState.length).toEqual(2);
            expect(debugResponse.newState.findIndex(x => x.id === 1)).toBeGreaterThanOrEqual(0);
            expect(debugResponse.newState.findIndex(x => x.id === 2)).toBeGreaterThanOrEqual(0);
            expect(debugResponse.action).toBe(actions[1]);
            debugResponse = debugResponses[3];
            expect(debugResponse.oldState).toBe(debugResponses[2].newState);
            expect(debugResponse.newState.length).toEqual(2);
            expect(debugResponse.action).toBe(actions[2]);
            debugResponse = debugResponses[4];
            expect(debugResponse.oldState).toBe(debugResponses[3].newState);
            expect(debugResponse.newState.length).toEqual(2);
            expect(debugResponse.action).toBe(actions[3]);
        });
    });
});