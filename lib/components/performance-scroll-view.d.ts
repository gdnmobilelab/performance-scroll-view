/// <reference types="react" />
import { Component } from "react";
import * as React from "react";
import { ItemBuffer, ItemBufferProperties } from "./item-buffer";
import { DummyScroller } from "./dummy-scroller";
export declare enum AddNewItemsTo {
    Top = "top",
    Bottom = "bottom",
}
export declare type AnimationEasingFunction = (currentTime: number, initialValue: number, changeInValue: number, duration: number) => number;
export interface PerformanceScrollViewProperties extends ItemBufferProperties {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    addNewItemsTo?: AddNewItemsTo;
    animationDuration?: number;
    animationEaseFunction?: AnimationEasingFunction;
    startIndex?: number;
    moreIndicatorGenerator?: (numberOfItems: number) => JSX.Element;
}
export interface ScrollViewAnimation {
    currentOffset: number;
    totalOffset: number;
    endTime: number;
}
export interface HeightAndPosition {
    position: number;
    height: number;
}
export interface PerformanceScrollViewState {
    itemBuffer: JSX.Element[];
    currentBufferOffset: number;
    container?: HTMLDivElement;
    mergedContainerStyles: React.CSSProperties;
    itemPositions: Map<number, HeightAndPosition>;
    totalHeight: number;
    currentScrollPosition: number;
    animation?: ScrollViewAnimation;
    isInitialRenderLoop: boolean;
    pendingItemRenders: Map<number, number>;
    newlyAddedIndexes: number[];
    numberOfNewItems: number;
}
export declare class PerformanceScrollView extends Component<PerformanceScrollViewProperties, PerformanceScrollViewState> {
    dummyScrollContainer: DummyScroller;
    itemBuffer: ItemBuffer;
    constructor(props: PerformanceScrollViewProperties);
    componentWillReceiveProps(nextProps: PerformanceScrollViewProperties): Promise<void>;
    renderChildItems(): JSX.Element[] | null;
    renderMoreIndicator(): JSX.Element | null;
    render(): JSX.Element;
    setContainer(el: HTMLDivElement): void;
    componentDidMount(): void;
    containerScrolled(newScrollPosition: number): void;
    animationTimer: number;
    componentDidUpdate(): void;
    updateAnimation(rightNow: number): void;
    isAtScrollEnd(): boolean;
    scrollToEnd(): Promise<void>;
    itemRendered(newItemIndex: number, width: number, height: number): void;
    calculatePendingRenders(): void;
    invalidateHeight(itemIndex: number): void;
    getCurrentVisibleItemBounds(): {
        top: number;
        bottom: number;
    };
    shouldResetPendingItemCount(): boolean;
    onIdle(): Promise<void>;
}
