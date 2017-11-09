import { PerformanceScrollView } from "./performance-scroll-view";

export interface ItemBufferProperties {
    numberOfItems: number;
    itemBufferSize: number;
    itemGenerator: (indexes: number[]) => JSX.Element[] | Promise<JSX.Element[]>;
    loadingMoreIndicator?: JSX.Element;
}

export interface ItemBufferState {
    currentBufferOffset: number;
}

// export function createItemBuffer(offset: number, props: ItemBufferProperties) {
//     let items: JSX.Element[] = [];

//     let start = offset;
//     let end = Math.min(offset + props.itemBufferSize, props.numberOfItems);

//     for (let i = start; i < end; i++) {
//         items.push(props.itemGenerator(i));
//     }

//     return items;
// }

export class ItemBuffer {
    // target: PerformanceScrollView;
    elementCache = new Map<number, JSX.Element>();

    constructor(target: PerformanceScrollView) {
        // this.target = target;
    }

    async load(props: ItemBufferProperties, state: ItemBufferState): Promise<JSX.Element[]> {
        // If the total number of items is below our buffer size, we create a
        // smaller buffer.
        let bufferSize = Math.min(props.itemBufferSize, props.numberOfItems);
        let startIndex = state.currentBufferOffset;
        let endIndex = startIndex + bufferSize;

        startIndex = Math.max(startIndex, 0);
        endIndex = Math.min(endIndex, props.numberOfItems);

        let startLoadingIndicator: JSX.Element | undefined = undefined;
        let endLoadingIndicator: JSX.Element | undefined = undefined;

        if (startIndex > 0 && props.loadingMoreIndicator) {
            // If the start index is above zero then rather than display the first item,
            // we insert our loading more indicator below.
            startIndex++;
            startLoadingIndicator = props.loadingMoreIndicator;
        }
        if (endIndex < props.numberOfItems && props.loadingMoreIndicator) {
            endIndex--;
            endLoadingIndicator = props.loadingMoreIndicator;
        }

        let items = await this.fetchItems(startIndex, endIndex, props);

        if (startLoadingIndicator) {
            console.log("ADDING INDICATOR AT START");
            items.unshift(startLoadingIndicator);
        }
        if (endLoadingIndicator) {
            console.log("ADDING INDICATOR AT END");
            items.push(endLoadingIndicator);
        }
        console.log("returning", items.length, "items");
        return items;
    }

    async fetchItems(startIndex: number, endIndex: number, props: ItemBufferProperties): Promise<JSX.Element[]> {
        let indexesToFetch: number[] = [];
        let results = new Map<number, JSX.Element>();

        console.info(`ITEM BUFFER: Fetching items from ${startIndex} to ${endIndex}`);

        for (let index = startIndex; index < endIndex; index++) {
            let result = this.elementCache.get(index);

            if (!result) {
                indexesToFetch.push(index);
            } else {
                results.set(index, result);
            }
        }

        if (indexesToFetch.length === 0) {
            console.info(`ITEM BUFFER: Returning ${results.size} cached items.`);
            return this.transformMapToOrderedElementArray(results);
        }

        console.info(`ITEM BUFFER: Fetching ${indexesToFetch.length} new items`);

        let fetchedResults = await Promise.resolve(props.itemGenerator(indexesToFetch));

        indexesToFetch.forEach((key, arrayIndex) => {
            let newResult = fetchedResults[arrayIndex];
            if (!newResult) {
                throw new Error("Could not get item for index" + key);
            }

            this.elementCache.set(key, newResult);
            results.set(key, newResult);
        });

        console.info(
            `ITEM BUFFER: Returning ${results.size -
                indexesToFetch.length} cached items, ${indexesToFetch.length} new items`
        );
        return this.transformMapToOrderedElementArray(results);
    }

    transformMapToOrderedElementArray(map: Map<number, JSX.Element>): JSX.Element[] {
        let keys = Array.from(map.keys()).sort((a, b) => a - b);
        return keys.map(key => map.get(key)!);
    }

    // async checkOffset() {
    //     // Difficulty here is that we don't know the height of un-rendered items, so instead
    //     // we just go by the number of items. That might result in more redraws than we would
    //     // otherwise want, but so be it.

    //     let currentY = 0;
    //     let scrollTop = this.target.state.currentScrollPosition;

    //     let scrollBottom = scrollTop + this.target.dummyScrollContainer.clientHeight;

    //     // First we find how what items are currently visible on screen

    //     let visibleStartIndex = -1;
    //     let visibleStartOffset = -1;
    //     let visibleEndIndex = -1;

    //     let oldTop = this.target.state.currentBufferOffset;
    //     let oldBottom = oldTop + this.target.props.itemBufferSize;
    //     console.log({ oldTop, oldBottom });
    //     for (let key = oldTop; key < oldBottom; key++) {
    //         let val = this.target.state.itemHeights.get(key);
    //         if (!val) {
    //             console.info(`Expected to get height at ${key} but it wasn't there.`);
    //             throw new Error("Expected item height at" + key);
    //         }
    //         currentY += val;
    //         if (currentY > scrollTop && visibleStartIndex === -1) {
    //             visibleStartIndex = key;
    //             visibleStartOffset = currentY - scrollTop - val;
    //         }

    //         if (currentY >= scrollBottom && visibleEndIndex === -1) {
    //             visibleEndIndex = key;
    //         }
    //     }

    //     // this.target.state.itemHeights.forEach((val, key) => {
    //     //     currentY += val;
    //     //     if (currentY > scrollTop && visibleStartIndex === -1) {
    //     //         visibleStartIndex = key;
    //     //     }
    //     //     if (currentY > scrollBottom && visibleEndIndex === -1) {
    //     //         visibleEndIndex = key;
    //     //     }
    //     // });

    //     // Then work out the midpoint - we consider the current middle of the screen

    //     let midPoint = Math.round(visibleStartIndex + (visibleEndIndex - visibleStartIndex) / 2);

    //     console.log({ visibleStartIndex, visibleEndIndex, midPoint, visibleStartOffset });

    //     let topHalf = Math.round(this.target.props.itemBufferSize / 2);
    //     let bottomHalf = this.target.props.itemBufferSize - topHalf;

    //     let newTop = midPoint - topHalf;
    //     let newBottom = midPoint + bottomHalf;

    //     console.log({
    //         newTop,
    //         newBottom,
    //         oldTop,
    //         oldBottom
    //     });

    //     if (newTop === oldTop && newBottom === oldBottom) {
    //         console.info("ITEM BUFFER: no new items after scroll");
    //         return;
    //     }

    //     let newItems = await this.fetchItems(newTop, newBottom);

    //     let heightRemoved = 0;
    //     let newScrollPosition = this.target.state.currentScrollPosition;

    //     for (let idx = this.target.state.currentBufferOffset; idx < newTop; idx++) {
    //         console.log("REMOVE FROM TOP!", idx);
    //         let height = this.target.state.itemHeights.get(idx);
    //         if (!height) {
    //             throw new Error("Expected height for idx" + idx);
    //         }
    //         this.target.state.itemHeights.delete(idx);
    //         heightRemoved += height;
    //         newScrollPosition -= height;
    //     }
    //     for (let idx = newBottom; idx < oldBottom; idx++) {
    //         console.log("REMOVE FROM BOTTOM", idx);
    //         let height = this.target.state.itemHeights.get(idx);
    //         if (!height) {
    //             throw new Error("Expected height for idx" + idx);
    //         }
    //         heightRemoved += height;
    //         // newScrollPosition += height;
    //         this.target.state.itemHeights.delete(idx);
    //     }

    //     let scroll = -visibleStartOffset;
    //     for (let idx = newTop; idx < visibleStartIndex; idx++) {
    //         let height = this.target.state.itemHeights.get(idx);
    //         if (height) {
    //             scroll += height;
    //         }
    //     }

    //     console.log("removed", heightRemoved, "scroll", scroll, newScrollPosition);

    //     // debugger;
    //     this.target.setState({
    //         currentScrollPosition: scroll,
    //         itemHeights: this.target.state.itemHeights,
    //         currentBufferOffset: newTop,
    //         itemBuffer: newItems,
    //         totalHeight: this.target.state.totalHeight - heightRemoved
    //     });
    // }
}
