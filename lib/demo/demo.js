import { PerformanceScrollView, AddNewItemsTo } from "../components/performance-scroll-view";
import * as React from "react";
// import backOut from "eases/back-out";
const containerStyles = {
    display: "flex",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    padding: 0,
    flexDirection: "column"
};
const selectStyles = {
    width: "100%"
};
function basicDemo(numberOfItems) {
    function itemGenerator(indexes) {
        return indexes.map(index => {
            return (React.createElement("div", { style: { height: "60vh", background: "yellow", margin: "10px" } },
                React.createElement("button", { onClick: () => alert("hello") },
                    "hello, item ",
                    index)));
        });
    }
    return (React.createElement(PerformanceScrollView, { style: { flexGrow: 1 }, itemGenerator: itemGenerator, numberOfItems: numberOfItems, itemBufferSize: 10 }));
}
function easeOutBack(t, b, c, d, s = 0) {
    if (s === 0) {
        s = 1.70158;
    }
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
}
function bottomAlignDemo(numberOfItems) {
    function itemGenerator(indexes) {
        return indexes.map(index => {
            let height = 20;
            if (index % 2 === 0) {
                height *= 2;
            }
            return (React.createElement("div", { style: { background: "white", margin: 10, height: height }, key: "item_" + index, onClick: () => {
                    console.log("CLICK!");
                    demoInstance.setState({ numberOfItems: demoInstance.state.numberOfItems + 1 });
                } },
                "test ",
                index));
        });
    }
    let moreIndicator = React.createElement("div", null, "LOADING MOOOOREEEEE");
    let generator = (numberOfItems) => {
        return React.createElement("div", null, "more stuff arrived.");
    };
    return (React.createElement(PerformanceScrollView, { style: { flexGrow: 1 }, addNewItemsTo: AddNewItemsTo.Bottom, animationDuration: 750, animationEaseFunction: easeOutBack, numberOfItems: numberOfItems, itemBufferSize: 40, startIndex: 99, itemGenerator: itemGenerator, loadingMoreIndicator: moreIndicator, moreIndicatorGenerator: generator }));
}
let demoInstance;
export class Demo extends React.Component {
    constructor(props) {
        super(props);
        demoInstance = this;
        this.state = {
            numberOfItems: 150,
            mode: window.location.hash.substr(1) || "basic"
        };
    }
    render() {
        return (React.createElement("div", { style: containerStyles },
            React.createElement("div", null,
                React.createElement("select", { style: selectStyles, onChange: this.changed.bind(this), defaultValue: this.state.mode },
                    React.createElement("option", { value: "basic" }, "Basic demo"),
                    React.createElement("option", { value: "bottom-align" }, "Bottom align demo"))),
            this.state.mode == "basic"
                ? basicDemo(this.state.numberOfItems)
                : bottomAlignDemo(this.state.numberOfItems)));
    }
    componentDidUpdate() {
        window.location.hash = this.state.mode;
    }
    changed(e) {
        let newValue = e.currentTarget.options[e.currentTarget.selectedIndex].value;
        this.setState({
            mode: newValue
        });
        console.log(newValue);
    }
}
//# sourceMappingURL=demo.js.map