/// <reference types="react" />
import { Component } from "react";
export interface ScrollViewItemProperties {
    onRender: (index: number, width: number, height: number) => void;
    itemIndex: number;
    y?: number;
    debugId?: string;
}
export declare class ScrollViewItem extends Component<ScrollViewItemProperties, any> {
    wrapperElement: HTMLDivElement;
    render(): JSX.Element;
    componentDidMount(): void;
    shouldComponentUpdate(nextProps: ScrollViewItemProperties): boolean;
}
