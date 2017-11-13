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

function basicDemo(numberOfItems: number) {
    function itemGenerator(indexes: number[]) {
        return indexes.map(index => {
            return (
                <div style={{ height: "60vh", background: "yellow", margin: "10px" }}>
                    <button onClick={() => alert("hello")}>hello, item {index}</button>
                </div>
            );
        });
    }

    return (
        <PerformanceScrollView
            style={{ flexGrow: 1 }}
            itemGenerator={itemGenerator}
            numberOfItems={numberOfItems}
            itemBufferSize={10}
        />
    );
}

function easeOutBack(t: number, b: number, c: number, d: number, s: number = 0) {
    if (s === 0) {
        s = 1.70158;
    }
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
}

function bottomAlignDemo(numberOfItems: number) {
    function itemGenerator(indexes: number[]) {
        return indexes.map(index => {
            let height = 20;
            if (index % 2 === 0) {
                height *= 2;
            }

            return (
                <div
                    style={{ background: "white", margin: 10, height: height }}
                    key={"item_" + index}
                    onClick={() => {
                        console.log("CLICK!");
                        demoInstance.setState({ numberOfItems: demoInstance.state.numberOfItems + 1 });
                    }}
                >
                    test {index}
                </div>
            );
        });
    }

    let moreIndicator = <div>LOADING MOOOOREEEEE</div>;

    let generator = (numberOfItems: number) => {
        return <div>more stuff arrived.</div>;
    };

    return (
        <PerformanceScrollView
            style={{ flexGrow: 1 }}
            addNewItemsTo={AddNewItemsTo.Bottom}
            animationDuration={750}
            animationEaseFunction={easeOutBack}
            numberOfItems={numberOfItems}
            itemBufferSize={40}
            startIndex={99}
            itemGenerator={itemGenerator}
            loadingMoreIndicator={moreIndicator}
            moreIndicatorGenerator={generator}
        />
    );
}

interface DemoState {
    mode: string;
    numberOfItems: number;
}

let demoInstance: any;

export class Demo extends React.Component<any, DemoState> {
    constructor() {
        super();
        demoInstance = this;
        this.state = {
            numberOfItems: 100,
            mode: window.location.hash.substr(1) || "basic"
        };
    }

    render() {
        return (
            <div style={containerStyles}>
                <div>
                    <select style={selectStyles} onChange={this.changed.bind(this)} defaultValue={this.state.mode}>
                        <option value="basic">Basic demo</option>
                        <option value="bottom-align">Bottom align demo</option>
                    </select>
                </div>
                {this.state.mode == "basic"
                    ? basicDemo(this.state.numberOfItems)
                    : bottomAlignDemo(this.state.numberOfItems)}
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
