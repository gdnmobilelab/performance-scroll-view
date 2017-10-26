import { Component } from "react";
import * as React from "react";
import { ScrollViewItem } from "./scroll-view-item";
import {
    dummyScrollContainerStyles,
    scrollViewStyles
    // childContainerStyles
} from "./scroll-view-styles";

export enum AddNewItemsTo {
    Top = "top",
    Bottom = "bottom"
}

interface PerformanceScrollViewProperties {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    addNewItemsTo?: AddNewItemsTo;
    animationDuration?: number;
    animationEaseFunction?: (
        currentTime: number,
        initialValue: number,
        changeInValue: number,
        duration: number
    ) => number;
}

interface ScrollViewAnimation {
    currentOffset: number;
    totalOffset: number;
    endTime: number;
}

interface PerformanceScrollViewState {
    container?: HTMLDivElement;
    mergedContainerStyles: React.CSSProperties;
    itemHeights: number[];
    totalHeight: number;
    currentScrollPosition: number;
    animation?: ScrollViewAnimation;
}

export class PerformanceScrollView extends Component<
    PerformanceScrollViewProperties,
    PerformanceScrollViewState
> {
    dummyScrollContainer: HTMLDivElement;
    // container: HTMLDivElement;

    constructor(props: PerformanceScrollViewProperties) {
        super(props);
        this.itemRendered = this.itemRendered.bind(this);
        this.containerScrolled = this.containerScrolled.bind(this);
        this.setContainer = this.setContainer.bind(this);
        this.updateAnimation = this.updateAnimation.bind(this);
        this.state = {
            itemHeights: [],
            totalHeight: 0,
            currentScrollPosition: 1,
            animationOffset: 0,
            mergedContainerStyles: Object.assign({}, props.style, scrollViewStyles)
        } as any;
    }

    renderChildItems() {
        if (!this.state.container) {
            // We have to use a two-stage rendering process because we need the container
            // to be rendered (to get its height) before we render the children. So if this
            // is the first render and we have no container yet, return nothing.
            return null;
        }

        let currentY = 0;
        if (
            this.props.addNewItemsTo == AddNewItemsTo.Bottom &&
            this.state.totalHeight < this.state.container.clientHeight
        ) {
            let allItemHeight = this.state.itemHeights.reduce((a, b) => a + b, 0);
            currentY = this.state.container.clientHeight - allItemHeight;
        }

        return React.Children.map(this.props.children, (child, idx) => {
            let yPosition: number | undefined = undefined;
            let height = this.state.itemHeights[idx];

            if (height) {
                let y = currentY - this.state.currentScrollPosition;
                if (this.state.animation) {
                    // console.log("apply offset", this.state.animation.currentOffset);
                    y += this.state.animation.currentOffset;
                }

                if (y + height > 0) {
                    yPosition = y;
                }

                currentY += this.state.itemHeights[idx];
            }

            return (
                <ScrollViewItem
                    key={"item_" + idx}
                    itemIndex={idx}
                    onRender={this.itemRendered}
                    y={yPosition}
                >
                    {child}
                </ScrollViewItem>
            );
        });
    }

    renderDummyScroller() {
        return (
            <div
                style={{
                    width: "100%",
                    minHeight: "100%",
                    paddingBottom: "2px",
                    height: this.state.totalHeight,
                    position: "absolute",
                    background: "transparent"
                }}
            />
        );
    }

    render() {
        return (
            <div
                id={this.props.id}
                style={this.state.mergedContainerStyles}
                className={this.props.className}
                ref={this.setContainer}
            >
                {this.renderChildItems()}
                <div
                    ref={el => (this.dummyScrollContainer = el!)}
                    style={dummyScrollContainerStyles}
                >
                    {this.renderDummyScroller()}
                </div>
            </div>
        );
    }

    setContainer(el: HTMLDivElement) {
        if (this.state.container) {
            return;
        }
        this.setState({
            container: el
        });
    }

    componentDidMount() {
        this.dummyScrollContainer.addEventListener("scroll", this.containerScrolled);
        this.dummyScrollContainer.addEventListener("click", e => {
            this.dummyScrollContainer.style.pointerEvents = "none";
            let el = document.elementFromPoint(e.clientX, e.clientY);
            this.dummyScrollContainer.style.pointerEvents = "";
            if (el) {
                let new_event = new (e.constructor as any)(e.type, e);
                el.dispatchEvent(new_event);
            }
        });
        this.containerScrolled();
    }

    containerScrolled() {
        // If an iOS scroll element is either at the max or min scroll position,
        // Safari sends the scroll event to the parent, all the up to document.body.
        // We don't want this - we want to contain the scrolling to this element. So if we
        // are at either extreme, we bump it by one pixel.

        let toSaveInState = this.dummyScrollContainer.scrollTop;

        if (this.dummyScrollContainer.scrollTop === 1) {
            toSaveInState = 0;
            return;
        }

        if (this.dummyScrollContainer.scrollTop === 0) {
            this.setScrollContainerPosition(1);
        } else if (
            this.dummyScrollContainer.scrollTop ===
            this.dummyScrollContainer.scrollHeight - this.dummyScrollContainer.clientHeight
        ) {
            this.dummyScrollContainer.scrollTop -= 1;
        }
        if (toSaveInState !== this.state.currentScrollPosition) {
            this.setState({
                currentScrollPosition: toSaveInState
            });
        }
    }

    setScrollContainerPosition(newPosition: number) {
        if (newPosition === 0 && this.dummyScrollContainer.scrollTop <= 1) {
            // Because of our 1px scroll buffer, we ignore any instructions to do this
            return;
        }
        console.warn("set scroll from", this.dummyScrollContainer.scrollTop, "to", newPosition);
        this.dummyScrollContainer.scrollTop = newPosition;
    }

    animationTimer: number;
    componentDidUpdate() {
        // this.containerScrolled();
        if (this.state.animation) {
            this.animationTimer = requestAnimationFrame(this.updateAnimation);
        }
    }

    updateAnimation(rightNow: number) {
        if (!this.state.animation) {
            return;
        }

        let timeUntilEnd = this.state.animation.endTime - Date.now();
        let howFarAlong = timeUntilEnd / this.props.animationDuration!;

        if (howFarAlong < 0) {
            // If we're at or past the end point in the animation, just clear state
            // and return.

            this.setState({
                animation: undefined
            });

            return;
        }

        let newOffset = this.state.animation.totalOffset * howFarAlong;

        if (this.props.animationEaseFunction) {
            newOffset = this.props.animationEaseFunction(
                this.props.animationDuration! - timeUntilEnd,
                this.state.animation.totalOffset,
                -this.state.animation.totalOffset,
                this.props.animationDuration!
            );
        }

        // There's no point setting state for a change that is too small to be visible
        // on screen. So we round the pixel value by window.pixelDeviceRatio:
        newOffset = Math.round(newOffset * window.devicePixelRatio) / window.devicePixelRatio;

        // Then check if that rounded number equals our current value. If it does, we set
        // the animation time to run again after a frame request, to see if the number has
        // increased enough by then to warrant re-drawing.
        if (newOffset === this.state.animation.currentOffset) {
            this.animationTimer = requestAnimationFrame(this.updateAnimation);
            return;
        }

        // setState() doesn't do a recursive merge, so we'll just set the currentOffset on
        // our existing object. Ideally we'd use Object.assign() to create a new one, but I'm
        // concerned about the performance implications (and this works anyway)

        this.state.animation.currentOffset = newOffset;

        this.setState({
            animation: this.state.animation
        });
    }

    itemRendered(index: number, width: number, height: number) {
        this.setState(
            state => {
                state.itemHeights[index] = height;

                console.log(
                    "Added item at",
                    height,
                    "total height now",
                    state.totalHeight + height
                );

                let animation: ScrollViewAnimation | undefined = undefined;

                if (this.props.animationDuration) {
                    let animationTotal = height;
                    if (state.animation) {
                        // If we have a currently running animation, we want to factor in the amount
                        // of animation left to run.
                        animationTotal += state.animation.currentOffset;
                        // and also cancel that current animation
                        cancelAnimationFrame(this.animationTimer);
                    }

                    animation = {
                        currentOffset: animationTotal,
                        totalOffset: animationTotal,
                        endTime: Date.now() + this.props.animationDuration
                    };
                }

                let newTotal = state.totalHeight + height;
                let scrollPosition = state.currentScrollPosition;
                if (
                    this.props.addNewItemsTo == AddNewItemsTo.Bottom &&
                    newTotal > this.state.container!.clientHeight
                ) {
                    scrollPosition = newTotal - this.state.container!.clientHeight + 1;
                }

                return {
                    itemHeights: state.itemHeights,
                    totalHeight: newTotal,
                    animation,
                    currentScrollPosition: scrollPosition
                };
            },
            () => {
                if (this.state.currentScrollPosition !== this.dummyScrollContainer.scrollTop) {
                    this.setScrollContainerPosition(this.state.currentScrollPosition);
                }
            }
        );
    }
}
