/// <reference types="react" />
import * as React from "react";
export interface DemoState {
    mode: string;
    numberOfItems: number;
}
export declare class Demo extends React.Component<any, DemoState> {
    constructor(props: any);
    render(): JSX.Element;
    componentDidUpdate(): void;
    changed(e: React.UIEvent<HTMLSelectElement>): void;
}
