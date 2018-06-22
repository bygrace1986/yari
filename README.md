# yari
Yet Another Redux Implementation

## Description
This is a lite Redux style store that allows consumers to connect to producers so that producers can know when the data they produce is being observed.

## Motive
In Redux the producer of data is disconnected from its consumer by design since multiple actors could modify the same slice of data in the store. The problem I ran into was that I had to dispatch a fetch action every time I wanted to select a slice of data to ensure that it was initialized. This became more cumbersome and error prone when I had projections that required 5+ fetches. Inevitably I would forget a fetch so part of the data would be missing depending on what path I followed in the application.

It felt like I was at a restaurant where after giving the waiter my order I had to instruct the kitchen on what ingredients to buy to fulfil my order. If I forgot an ingredient and they didn't have it on hand then it was just left out of my food when it came. The consumer shouldn't need to know how what it consumes is prepared. This was creating a tight coupling between my producers and consumers.

What I wanted was for the act of subscription to cascade back to the producers so that they could use their innate knowledge to fetch the necessary ingredients. That kind of functionality is provided out of the box with RxJs as long as the stream is unbroken. So I setup a Redux style store that lets hot and cold streams register with it as producers. The hot streams will always be pushing into the store. The cold streams will only push when someone is subscribed to the store.

Though not explicitly enforced this is practically only useful if your store is not global which goes against the "single source of truth" principle. But for my usage it was actually easier to not have a global state tree.

## Usage
Check out the unit tests for now. I'll write some details when I have time.