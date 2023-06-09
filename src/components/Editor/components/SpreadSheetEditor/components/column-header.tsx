import React from "react";

import {ContextMenu, ContextMenuTemplate} from "@components/ContextMenu";

export type ColumnHeaderProps = {
    absoluteIndex: number;
    height: number;
    width: number;
    className: string;
    onInsert: (absoluteIndex: number) => void;
    onDelete: (absoluteIndex: number) => void;
    onResize: (absoluteIndex: number, width: number) => void;
};

export const ColumnHeader: React.FC<ColumnHeaderProps> = props => {
    const ref = React.useRef<HTMLTableCellElement | null>(null);
    const resizeHandleRef = React.useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = React.useState<number>(props.width);
    const [previousWidth, setPreviousWidth] = React.useState<number>(props.width);

    if (props.width !== previousWidth) {
        setWidth(props.width);
        setPreviousWidth(props.width);
    }

    React.useEffect(() => {
        let dragging: boolean = false;
        let newWidth: number = 0;
        const handlePointerDown = (e: PointerEvent) => {
            dragging = true;
            document.body.style.cssText = "cursor: col-resize !important";
        };

        const handlePointerUp = () => {
            if (!dragging) {
                return;
            }
            dragging = false;
            document.body.style.cssText = "cursor: default";
            props.onResize(props.absoluteIndex, newWidth);
        };

        const handleColumnPointerMove = (e: PointerEvent) => {
            if (!dragging) {
                return;
            }

            if (!ref.current) {
                return;
            }

            const rect = ref.current.getBoundingClientRect();
            newWidth = e.clientX - rect.left;
            props.onResize(props.absoluteIndex, newWidth);
            setWidth(newWidth);
        };

        if (resizeHandleRef.current) {
            resizeHandleRef.current.addEventListener("pointerdown", handlePointerDown);
            document.addEventListener("pointermove", handleColumnPointerMove);
            document.addEventListener("pointerup", handlePointerUp);
        }

        return () => {
            if (resizeHandleRef.current) {
                resizeHandleRef.current.removeEventListener("pointerdown", handlePointerDown);
                document.removeEventListener("pointermove", handleColumnPointerMove);
                document.removeEventListener("pointerup", handlePointerUp);
            }
        };
    }, [props.onResize, props.absoluteIndex]);

    const contextMenuTemplate: ContextMenuTemplate = [
        {
            label: "Insert column",
            click: () => {
                props.onInsert(props.absoluteIndex);
            },
        },
        {
            label: "Delete column",
            click: () => {
                props.onDelete(props.absoluteIndex);
            },
        },
    ];

    return (
        <th
            style={{
                width,
                minWidth: width,
                maxWidth: width,
                height: props.height,
            }}
            className={props.className}
            data-column-index={props.absoluteIndex}
            ref={ref}
        >
            <ContextMenu parent={ref.current} template={contextMenuTemplate} />
            {props.children}
            <div className="SpreadSheetEditor__ColumnResizeHandle" ref={resizeHandleRef} />
        </th>
    );
};
