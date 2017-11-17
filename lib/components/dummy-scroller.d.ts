/// <reference types="react" />
import * as React from "react";
import { IdleWatcher } from "./idle-watcher";
export interface DummyScrollerProps {
    height: number;
    onScroll: (y: number) => void;
    onIdle?: () => void;
    scrollPosition: number;
}
export declare class DummyScroller extends React.Component<DummyScrollerProps> {
    element?: HTMLDivElement;
    idleWatcher?: IdleWatcher;
    render(): JSX.Element;
    componentDidMount(): void;
    currentTouchTarget?: {
        el: Element;
        touchY: number;
    };
    touchStart(e: TouchEvent): void;
    touchEnd(e: TouchEvent): void;
    passThroughEvent(e: MouseEvent | TouchEvent): Element;
    onScroll(): void;
    readonly clientHeight: number;
    readonly position: number;
    shouldComponentUpdate(nextProps: DummyScrollerProps): boolean;
    componentDidUpdate(oldProps: DummyScrollerProps): void;
}
