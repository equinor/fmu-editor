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

    React.useEffect(() => {
        props.onResize(props.absoluteIndex, height);
    }, [height, props.onResize, props.absoluteIndex]);

    React.useEffect(() => {
        let dragging: boolean = false;
        const resizeHandleRefCurrent = resizeHandleRef.current;

        const handlePointerDown = () => {
            dragging = true;
            document.body.style.cssText = "cursor: row-resize !important";
        };

        const handlePointerUp = () => {
            dragging = false;
            document.body.style.cssText = "cursor: default";
        };

        const handleColumnPointerMove = (e: PointerEvent) => {
            if (!dragging) {
                return;
            }

            if (!resizeHandleRefCurrent) {
                return;
            }

            const rect = ref.current.getBoundingClientRect();
            const newHeight = e.clientY - rect.top;

            setHeight(newHeight);
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
    }, []);

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
            <div className="SpreadSheetEditor__row-resize-handle" ref={resizeHandleRef} />
        </td>
    );
};
