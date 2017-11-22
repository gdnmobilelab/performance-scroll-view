var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    constructor(target) {
        // target: PerformanceScrollView;
        this.elementCache = new Map();
        // this.target = target;
    }
    load(props, state) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the total number of items is below our buffer size, we create a
            // smaller buffer.
            let bufferSize = Math.min(props.itemBufferSize, props.numberOfItems);
            let startIndex = state.currentBufferOffset;
            startIndex = Math.max(startIndex, 0);
            let endIndex = startIndex + bufferSize;
            endIndex = Math.min(endIndex, props.numberOfItems);
            let startLoadingIndicator = undefined;
            let endLoadingIndicator = undefined;
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
            let items = yield this.fetchItems(startIndex, endIndex, props);
            if (startLoadingIndicator) {
                console.info("BUFFER: Adding 'loading more' indicator to the top");
                items.unshift(startLoadingIndicator);
            }
            if (endLoadingIndicator) {
                console.info("BUFFER: Adding 'loading more' indicator to the bottom");
                items.push(endLoadingIndicator);
            }
            return items;
        });
    }
    fetchItems(startIndex, endIndex, props) {
        return __awaiter(this, void 0, void 0, function* () {
            let indexesToFetch = [];
            let results = new Map();
            console.info(`ITEM BUFFER: Fetching items from ${startIndex} to ${endIndex}, out of ${props.numberOfItems} total items`);
            for (let index = startIndex; index < endIndex; index++) {
                let result = this.elementCache.get(index);
                console.log("get item?", index);
                if (!result) {
                    indexesToFetch.push(index);
                }
                else {
                    results.set(index, result);
                }
            }
            if (indexesToFetch.length === 0) {
                console.info(`ITEM BUFFER: Returning ${results.size} cached items.`);
                return this.transformMapToOrderedElementArray(results);
            }
            console.info(`ITEM BUFFER: Fetching ${indexesToFetch.length} new items`);
            let fetchedResults = yield Promise.resolve(props.itemGenerator(indexesToFetch));
            indexesToFetch.forEach((key, arrayIndex) => {
                let newResult = fetchedResults[arrayIndex];
                if (!newResult) {
                    throw new Error("Could not get item for index" + key);
                }
                this.elementCache.set(key, newResult);
                results.set(key, newResult);
            });
            console.info(`ITEM BUFFER: Returning ${results.size -
                indexesToFetch.length} cached items, ${indexesToFetch.length} new items`);
            return this.transformMapToOrderedElementArray(results);
        });
    }
    transformMapToOrderedElementArray(map) {
        let keys = Array.from(map.keys()).sort((a, b) => a - b);
        return keys.map(key => map.get(key));
    }
}
//# sourceMappingURL=item-buffer.js.map