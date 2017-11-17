import { Component } from "react";
import * as React from "react";
const scrollViewItemCSS = {
    position: "absolute",
    transform: "translate3d(-100%,0,0)",
    left: 0,
    width: "100%",
    background: process.env.NODE_ENV == "development" ? "red" : undefined
};
export class ScrollViewItem extends Component {
    render() {
        let style = scrollViewItemCSS;
        if (this.props.y !== undefined) {
            style = Object.assign({}, style, {
                transform: `translate3d(0,${this.props.y}px,0)`
            });
        }
        return (React.createElement("div", { id: this.props.debugId, ref: el => (this.wrapperElement = el), style: style }, this.props.children));
    }
    componentDidMount() {
        let size = this.wrapperElement.getBoundingClientRect();
        this.props.onRender(this.props.itemIndex, size.width, size.height);
    }
    shouldComponentUpdate(nextProps) {
        return nextProps.y !== this.props.y;
    }
}
//# sourceMappingURL=scroll-view-item.js.map