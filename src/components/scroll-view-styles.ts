import { CSSProperties } from "react";

export const scrollViewStyles: CSSProperties = {
    overflow: "hidden",
    position: "relative",
    background: process.env.NODE_ENV == "development" ? "blue" : undefined
};
