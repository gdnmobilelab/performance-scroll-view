import { CSSProperties } from "react";

export const scrollViewStyles: CSSProperties = {
    overflow: "hidden",
    position: "relative",
    background: process.env.NODE_ENV == "development" ? "blue" : undefined
};

export const childContainerStyles: CSSProperties = {
    position: "absolute",
    height: "100%",
    width: "100%",
    overflow: "hidden"
};

export const dummyScrollContainerStyles: CSSProperties = {
    position: "absolute",
    height: "100%",
    width: "100%",
    overflow: "auto",
    top: 0,
    WebkitOverflowScrolling: "touch",
    WebkitTapHighlightColor: "rgba(0,0,0,0)"
};
