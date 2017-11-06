import { Component } from "react";
import * as React from "react";
import { ScrollViewItem } from "./scroll-view-item";
import {
    scrollViewStyles
    // childContainerStyles
} from "./scroll-view-styles";
// import { /*ForwardsIndicator,*/ BackwardsIndicator } from "./paging-indicator";
import { ItemBuffer, ItemBufferProperties } from "./item-buffer";
// import { IdleWatcher } from "./idle-watcher";
import { DummyScroller } from "./dummy-scroller";

export enum AddNewItemsTo {
    Top = "top",
    Bottom = "bottom"
}

type AnimationEasingFunction = (
    currentTime: number,
    initialValue: number,
    changeInValue: number,
    duration: number
) => number;

export interface PerformanceScrollViewProperties extends ItemBufferProperties {
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    addNewItemsTo?: AddNewItemsTo;
    animationDuration?: number;
    animationEaseFunction?: AnimationEasingFunction;
    startIndex?: number;
}

interface ScrollViewAnimation {
    currentOffset: number;
    totalOffset: number;
    endTime: number;
}

export interface PerformanceScrollViewState {
    itemBuffer: JSX.Element[];
    currentBufferOffset: number;
    container?: HTMLDivElement;
    mergedContainerStyles: React.CSSProperties;
    itemHeights: Map<number, number>;
    totalHeight: number;
    currentScrollPosition: number;
    animation?: ScrollViewAnimation;
    isInitialRenderLoop: boolean;
    awaitingItemSizes: boolean;
}

export class PerformanceScrollView extends Component<PerformanceScrollViewProperties, PerformanceScrollViewState> {
    dummyScrollContainer: DummyScroller;
    itemBuffer: ItemBuffer;

    constructor(props: PerformanceScrollViewProperties) {
        super(props);

        // Bind functions to our class, to ensure it can access the right "this" variable
        this.itemRendered = this.itemRendered.bind(this);
        this.containerScrolled = this.containerScrolled.bind(this);
        this.setContainer = this.setContainer.bind(this);
        this.updateAnimation = this.updateAnimation.bind(this);
        this.onIdle = this.onIdle.bind(this);

        let bufferOffset = 0;
        if (props.startIndex) {
            // If we've specified a startIndex, we need to make sure our current buffer window
            // encompasses the item we want to start with.

            bufferOffset = props.startIndex - Math.floor(props.itemBufferSize / 2);

            // Then make sure it actually fits within the bounds of our items
            bufferOffset = Math.max(bufferOffset, 0);
            bufferOffset = Math.min(bufferOffset, props.numberOfItems - props.itemBufferSize);
        }

        this.state = {
            itemBuffer: [],
            currentBufferOffset: bufferOffset,
            itemHeights: new Map(),
            totalHeight: 0,
            currentScrollPosition: 1,
            animationOffset: 0,
            mergedContainerStyles: Object.assign({}, props.style, scrollViewStyles),
            isInitialRenderLoop: true,
            awaitingItemSizes: true
        } as any;

        this.itemBuffer = new ItemBuffer(this);
    }

    componentWillReceiveProps(nextProps: PerformanceScrollViewProperties) {
        console.log("prop!", arguments);
        // if (nextProps.numberOfItems !== this.props.numberOfItems) {
        //     this.setState({
        //         itemBuffer: createItemBuffer(0, nextProps)
        //     });
        // }
        console.log("newprops?", nextProps);
    }

    get isAtScrollBottom() {
        if (!this.state.container) {
            throw new Error("Cannot check if scroll is at bottom before the container is rendered");
        }
        if (this.state.totalHeight < this.state.container.clientHeight) {
            return true;
        }
        return (
            Math.abs(this.state.totalHeight - this.state.container!.clientHeight - this.state.currentScrollPosition) <=
            1
        );
    }

    renderChildItems() {
        if (!this.state.container) {
            // We have to use a two-stage rendering process because we need the container
            // to be rendered (to get its height) before we render the children. So if this
            // is the first render and we have no container yet, return nothing.
            return null;
        }

        let container = this.state.container;

        let currentY = 0;
        if (this.props.addNewItemsTo == AddNewItemsTo.Bottom && this.state.totalHeight < container.clientHeight) {
            currentY = container.clientHeight - this.state.totalHeight;
        }

        // console.log("start at Y", currentY, this.state.currentScrollPosition);

        return this.state.itemBuffer.map((child, idx) => {
            let indexInFullItemList = this.state.currentBufferOffset + idx;

            let yPosition: number | undefined = undefined;
            let height = this.state.itemHeights.get(indexInFullItemList);
            if (height) {
                let y = currentY - this.state.currentScrollPosition;
                if (this.state.animation && this.isAtScrollBottom) {
                    y += this.state.animation.currentOffset;
                }

                if (y + height > 0 && y < this.state.container!.clientHeight) {
                    yPosition = y;
                }

                currentY += height;
            }
            return (
                <ScrollViewItem
                    debugId={indexInFullItemList.toString()}
                    key={"item_" + indexInFullItemList}
                    itemIndex={indexInFullItemList}
                    onRender={this.itemRendered}
                    y={yPosition}
                >
                    {child}
                </ScrollViewItem>
            );
        });
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

                <DummyScroller
                    ref={el => (this.dummyScrollContainer = el!)}
                    height={this.state.totalHeight}
                    onScroll={this.containerScrolled}
                    onIdle={this.onIdle}
                />
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
        // new IdleWatcher(this.dummyScrollContainer);
    }

    containerScrolled(newScrollPosition: number) {
        // Save ourselves a setState loop here - if the scroll position hasn't actually
        // changed, ignore it.

        if (newScrollPosition === this.state.currentScrollPosition) {
            console.log("samescroll", newScrollPosition);
            return;
        }

        this.setState({
            currentScrollPosition: newScrollPosition
        });
    }

    animationTimer: number;
    componentDidUpdate() {
        // console.log("awaiting?", this.state.awaitingItemSizes);
        // this.containerScrolled();
        if (this.state.animation) {
            this.animationTimer = requestAnimationFrame(this.updateAnimation);
        }

        // There are a few special things we do in the initial render loop, like ignore
        // animation effects, and enforce the initial scroll position if startIndex has
        // been set. The best way I can think to detect if they are done is in this if
        // statement:

        if (this.state.isInitialRenderLoop && this.state.itemHeights.size === this.props.itemBufferSize) {
            console.info("VIEW: Initial render loop complete");
            this.setState({
                isInitialRenderLoop: false
            });
        }
        if (this.state.currentScrollPosition !== this.dummyScrollContainer.position) {
            this.dummyScrollContainer.position = this.state.currentScrollPosition;
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
        // ASSUMPTION: this function is called in order when rendering multiple items. Initial
        // tests show this is true, but it's an assumption regarding future versions.

        console.info("VIEW: Received render info for " + index);

        this.setState(
            state => {
                let newHeights = new Map<number, number>();
                state.itemHeights.forEach((val, key) => {
                    newHeights.set(key, val);
                });

                newHeights.set(index, height); //[index] = height;
                let animation: ScrollViewAnimation | undefined = undefined;

                // We don't animate arriving elements if we're in an initial rendering loop

                if ((1 as any) === 2 && this.props.animationDuration && this.state.isInitialRenderLoop === false) {
                    console.log("doing animation");
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

                if (index == this.props.startIndex && this.state.isInitialRenderLoop) {
                    let initialScrollPosition = 0;
                    for (let i = this.state.currentBufferOffset; i < index; i++) {
                        let height = newHeights.get(i);
                        if (!height) {
                            throw new Error("Tried to access position before previous elements are rendered");
                        }
                        initialScrollPosition += height;
                    }

                    scrollPosition = initialScrollPosition;
                    if (this.props.addNewItemsTo == AddNewItemsTo.Bottom) {
                        scrollPosition -= this.state.container!.clientHeight;
                        scrollPosition += newHeights.get(this.props.startIndex)!;
                    }
                } /*else if (
                    this.state.isInitialRenderLoop === false &&
                    this.props.addNewItemsTo == AddNewItemsTo.Bottom &&
                    this.isAtScrollBottom
                ) {
                    console.log("bottom insert?");
                    scrollPosition = Math.max(0, newTotal - state.container!.clientHeight + 1);
                }*/

                let idx = 0;
                let rollingHeight = 0;
                let bufferStart = this.state.currentBufferOffset;
                let bufferEnd = bufferStart + this.props.itemBufferSize;
                for (idx = bufferStart; idx < bufferEnd; idx++) {
                    let height = this.state.itemHeights.get(idx);

                    if (height) {
                        rollingHeight += height;
                    }

                    if (rollingHeight > this.state.currentScrollPosition) {
                        break;
                    }
                }
                console.log("top index calculated to be", idx);
                if (this.state.isInitialRenderLoop === false && index < idx) {
                    // return {};
                    scrollPosition += height;
                    console.info("post initial", index, scrollPosition);
                }

                return {
                    itemHeights: newHeights,
                    totalHeight: newTotal,
                    animation,
                    awaitingItemSizes: false,
                    currentScrollPosition: scrollPosition
                };
            },
            () => {
                console.log("state is set?");
            }
        );
    }

    onIdle() {
        this.itemBuffer.checkOffset();
    }
}
