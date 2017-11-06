import { PerformanceScrollView } from "./performance-scroll-view";

export interface ItemBufferProperties {
    numberOfItems: number;
    itemBufferSize: number;
    itemGenerator: (indexes: number[]) => JSX.Element[] | Promise<JSX.Element[]>;
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
    target: PerformanceScrollView;
    elementCache = new Map<number, JSX.Element>();

    constructor(target: PerformanceScrollView) {
        this.target = target;
        this.load();
    }

    load() {
        let startIndex = this.target.state.currentBufferOffset;
        let endIndex = startIndex + this.target.props.itemBufferSize;

        startIndex = Math.max(startIndex, 0);
        endIndex = Math.min(endIndex, this.target.props.numberOfItems);

        this.fetchItems(startIndex, endIndex).then(results => {
            this.target.setState({
                itemBuffer: results
            });
        });
    }

    fetchItems(startIndex: number, endIndex: number): Promise<JSX.Element[]> {
        return Promise.resolve()
            .then(() => {
                let indexesToFetch: number[] = [];
                let results = new Map<number, JSX.Element>();

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
                    return results;
                }

                console.info(`ITEM BUFFER: Fetching ${indexesToFetch.length} new items`);

                return Promise.resolve(this.target.props.itemGenerator(indexesToFetch)).then(fetchedResults => {
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
                    return results;
                });
            })
            .then(map => {
                let elements: JSX.Element[] = [];
                for (let index = startIndex; index < endIndex; index++) {
                    elements.push(map.get(index)!);
                }
                return elements;
            });
    }

    async checkOffset() {
        // Difficulty here is that we don't know the height of un-rendered items, so instead
        // we just go by the number of items. That might result in more redraws than we would
        // otherwise want, but so be it.

        let currentY = 0;
        let scrollTop = this.target.state.currentScrollPosition;

        let scrollBottom = scrollTop + this.target.dummyScrollContainer.clientHeight;

        // If we have fewer items than we have buffer, we bring the size of the buffer down.
        let actualBufferSize = Math.min(this.target.props.numberOfItems, this.target.props.itemBufferSize);

        // First we find how what items are currently visible on screen

        let visibleStartIndex = -1;
        let visibleStartOffset = -1;
        let visibleEndIndex = -1;

        let oldTop = this.target.state.currentBufferOffset;
        let oldBottom = oldTop + actualBufferSize;
        console.log({ oldTop, oldBottom });
        for (let key = oldTop; key < oldBottom; key++) {
            let val = this.target.state.itemHeights.get(key);
            if (!val) {
                console.info(`Expected to get height at ${key} but it wasn't there.`);
                throw new Error("Expected item height at" + key);
            }
            currentY += val;
            if (currentY > scrollTop && visibleStartIndex === -1) {
                visibleStartIndex = key;
                visibleStartOffset = currentY - scrollTop - val;
            }

            if (currentY >= scrollBottom && visibleEndIndex === -1) {
                visibleEndIndex = key;
            }
        }

        // this.target.state.itemHeights.forEach((val, key) => {
        //     currentY += val;
        //     if (currentY > scrollTop && visibleStartIndex === -1) {
        //         visibleStartIndex = key;
        //     }
        //     if (currentY > scrollBottom && visibleEndIndex === -1) {
        //         visibleEndIndex = key;
        //     }
        // });

        // Then work out the midpoint - we consider the current middle of the screen

        let midPoint = Math.round(visibleStartIndex + (visibleEndIndex - visibleStartIndex) / 2);

        console.log({ visibleStartIndex, visibleEndIndex, midPoint, visibleStartOffset });

        let topHalf = Math.round(this.target.props.itemBufferSize / 2);
        let bottomHalf = this.target.props.itemBufferSize - topHalf;

        let newTop = midPoint - topHalf;
        let newBottom = midPoint + bottomHalf;

        console.log({
            newTop,
            newBottom,
            oldTop,
            oldBottom
        });

        if (newTop === oldTop && newBottom === oldBottom) {
            console.info("ITEM BUFFER: no new items after scroll");
            return;
        }

        let newItems = await this.fetchItems(newTop, newBottom);

        let heightRemoved = 0;
        let newScrollPosition = this.target.state.currentScrollPosition;

        for (let idx = this.target.state.currentBufferOffset; idx < newTop; idx++) {
            console.log("REMOVE FROM TOP!", idx);
            let height = this.target.state.itemHeights.get(idx);
            if (!height) {
                throw new Error("Expected height for idx" + idx);
            }
            this.target.state.itemHeights.delete(idx);
            heightRemoved += height;
            newScrollPosition -= height;
        }
        for (let idx = newBottom; idx < oldBottom; idx++) {
            console.log("REMOVE FROM BOTTOM", idx);
            let height = this.target.state.itemHeights.get(idx);
            if (!height) {
                throw new Error("Expected height for idx" + idx);
            }
            heightRemoved += height;
            // newScrollPosition += height;
            this.target.state.itemHeights.delete(idx);
        }

        let scroll = -visibleStartOffset;
        for (let idx = newTop; idx < visibleStartIndex; idx++) {
            let height = this.target.state.itemHeights.get(idx);
            if (height) {
                scroll += height;
            }
        }

        console.log("removed", heightRemoved, "scroll", scroll, newScrollPosition);

        // debugger;
        this.target.setState({
            currentScrollPosition: scroll,
            itemHeights: this.target.state.itemHeights,
            currentBufferOffset: newTop,
            itemBuffer: newItems,
            totalHeight: this.target.state.totalHeight - heightRemoved
        });
    }
}
