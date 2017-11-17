/// <reference types="react" />
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
export declare class ItemBuffer {
    elementCache: Map<number, JSX.Element>;
    constructor(target: PerformanceScrollView);
    load(props: ItemBufferProperties, state: ItemBufferState): Promise<JSX.Element[]>;
    fetchItems(startIndex: number, endIndex: number, props: ItemBufferProperties): Promise<JSX.Element[]>;
    transformMapToOrderedElementArray(map: Map<number, JSX.Element>): JSX.Element[];
}
