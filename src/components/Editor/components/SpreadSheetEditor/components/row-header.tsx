import React from "react";

import {ContextMenu, ContextMenuTemplate} from "@components/ContextMenu";

export type RowHeaderProps = {
    absoluteIndex: number;
    height: number;
    width: number;
    className: string;
    onInsert: (absoluteIndex: number) => void;
    onDelete: (absoluteIndex: number) => void;
    onResize: (absoluteIndex: number, height: number) => void;
};

export const RowHeader: React.FC<RowHeaderProps> = props => {
    const ref = React.useRef<HTMLTableCellElement | null>(null);
    const resizeHandleRef = React.useRef<HTMLDivElement | null>(null);
    const [height, setHeight] = React.useState<number>(props.height);
    const [previousHeight, setPreviousHeight] = React.useState<number>(props.height);

    if (props.height !== previousHeight) {
        setHeight(props.height);
        setPreviousHeight(props.height);
    }

    React.useEffect(() => {
        let dragging: boolean = false;
        let newHeight: number = 0;
        const resizeHandleRefCurrent = resizeHandleRef.current;

        const handlePointerDown = () => {
            dragging = true;
            document.body.style.cssText = "cursor: row-resize !important";
        };

        const handlePointerUp = () => {
            if (!dragging) {
                return;
            }
            dragging = false;
            document.body.style.cssText = "cursor: default";
            props.onResize(props.absoluteIndex, newHeight);
        };

        const handleColumnPointerMove = (e: PointerEvent) => {
            if (!dragging) {
                return;
            }

            if (!resizeHandleRefCurrent) {
                return;
            }

            const rect = ref.current.getBoundingClientRect();
            newHeight = e.clientY - rect.top;

            setHeight(newHeight);
            props.onResize(props.absoluteIndex, newHeight);
        };

        if (resizeHandleRefCurrent) {
            resizeHandleRefCurrent.addEventListener("pointerdown", handlePointerDown);
            document.addEventListener("pointermove", handleColumnPointerMove);
            document.addEventListener("pointerup", handlePointerUp);
        }

        return () => {
            if (resizeHandleRefCurrent) {
                resizeHandleRefCurrent.removeEventListener("pointerdown", handlePointerDown);
                document.removeEventListener("pointermove", handleColumnPointerMove);
                document.removeEventListener("pointerup", handlePointerUp);
            }
        };
    }, [props.onResize, props.absoluteIndex]);

    const contextMenuTemplate: ContextMenuTemplate = [
        {
            label: "Insert row",
            click: () => {
                props.onInsert(props.absoluteIndex);
            },
        },
        {
            label: "Delete row",
            click: () => {
                props.onDelete(props.absoluteIndex);
            },
        },
    ];

    return (
        <td
            style={{
                width: props.width,
                minHeight: height,
                maxHeight: height,
                height,
            }}
            className={props.className}
            data-row-index={props.absoluteIndex}
            ref={ref}
        >
            <ContextMenu parent={ref.current} template={contextMenuTemplate} />
            {props.children}
            <div className="SpreadSheetEditor__RowResizeHandle" ref={resizeHandleRef} />
        </td>
    );
};
