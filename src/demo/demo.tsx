import { PerformanceScrollView, AddNewItemsTo } from "../components/performance-scroll-view";
import * as React from "react";
// import backOut from "eases/back-out";

const containerStyles: React.CSSProperties = {
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

function basicDemo() {
    return (
        <PerformanceScrollView style={{ flexGrow: 1 }}>
            <div style={{ height: "60vh", background: "yellow", margin: "10px" }}>
                <button onClick={() => alert("hello")}>hello</button>
            </div>
            <div style={{ height: "60vh", background: "green", margin: "10px" }}>hello2</div>
            <div style={{ height: "60vh", background: "pink", margin: "10px" }}>hello2</div>
        </PerformanceScrollView>
    );
}

let bottomAlignElements: JSX.Element[] = [];

function addBottomAlignElement() {
    bottomAlignElements.push(
        <div
            style={{ background: "white", margin: 10 }}
            key={"item_" + bottomAlignElements.length}
            onClick={addBottomAlignElement}
        >
            test {bottomAlignElements.length}
        </div>
    );

    if (demoInstance) {
        demoInstance.setState({
            blah: Date.now()
        });
    }
}

addBottomAlignElement();
addBottomAlignElement();

function easeOutBack(t: number, b: number, c: number, d: number, s: number = 0) {
    if (s === 0) {
        s = 1.70158;
    }
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
}

function bottomAlignDemo() {
    return (
        <PerformanceScrollView
            style={{ flexGrow: 1 }}
            addNewItemsTo={AddNewItemsTo.Bottom}
            animationDuration={750}
            animationEaseFunction={easeOutBack}
        >
            {bottomAlignElements}
        </PerformanceScrollView>
    );
}

interface DemoState {
    mode: string;
}

let demoInstance: any;

export class Demo extends React.Component<any, DemoState> {
    constructor() {
        super();
        demoInstance = this;
        this.state = {
            mode: window.location.hash.substr(1) || "basic"
        };
    }

    render() {
        return (
            <div style={containerStyles}>
                <div>
                    <select
                        style={selectStyles}
                        onChange={this.changed.bind(this)}
                        defaultValue={this.state.mode}
                    >
                        <option value="basic">Basic demo</option>
                        <option value="bottom-align">Bottom align demo</option>
                    </select>
                </div>
                {this.state.mode == "basic" ? basicDemo() : bottomAlignDemo()}
            </div>
        );
    }

    componentDidUpdate() {
        window.location.hash = this.state.mode;
    }

    changed(e: React.UIEvent<HTMLSelectElement>) {
        let newValue = e.currentTarget.options[e.currentTarget.selectedIndex].value;
        this.setState({
            mode: newValue
        });
        console.log(newValue);
    }
}
