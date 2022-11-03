import useSize from "@react-hook/size";

import React from "react";

export type OverflowEllipsisType = {
    text: string;
};

export const OverflowEllipsis: React.FC<OverflowEllipsisType> = props => {
    const [adjustedText, setAdjustedText] = React.useState<string>(props.text);
    const ref = React.useRef<HTMLDivElement | null>(null);
    const size = useSize(ref.current);

    const measureTextWidth = (text: string, font?: string): number => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context && ref.current) {
            context.font = font || getComputedStyle(ref.current).font;

            return context.measureText(text).width;
        }
        return 0;
    };

    React.useEffect(() => {
        if (size[0] === 0) {
            return;
        }
        let middlePosition = Math.round(props.text.length / 2);
        let firstPartOfText = props.text.substring(0, middlePosition);
        let secondPartOfText = props.text.substring(middlePosition);
        let ellipsis = "";
        let count = 0;
        while (
            measureTextWidth(firstPartOfText + ellipsis + secondPartOfText) >
            size[0]
        ) {
            firstPartOfText = firstPartOfText.substring(
                0,
                firstPartOfText.length - 1
            );
            secondPartOfText = secondPartOfText.substring(1);
            ellipsis = "...";
            if (count++ > 20) {
                break;
            }
        }
        setAdjustedText(firstPartOfText + ellipsis + secondPartOfText);
    }, [size, props.text]);

    return <div ref={ref}>{adjustedText}</div>;
};
