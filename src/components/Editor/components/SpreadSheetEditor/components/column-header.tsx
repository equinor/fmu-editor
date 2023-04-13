import React from "react";

import {ContextMenu, ContextMenuTemplate} from "@components/ContextMenu";

export type ColumnHeaderProps = {
    absoluteIndex: number;
    height: number;
    width: number;
    className: string;
    onInsert: (absoluteIndex: number) => void;
    onDelete: (absoluteIndex: number) => void;
};

export const ColumnHeader: React.FC<ColumnHeaderProps> = props => {
    const ref = React.useRef<HTMLTableCellElement | null>(null);
    const resizeHandleRef = React.useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = React.useState<number>(props.width);

    React.useEffect(() => {
        let dragging: boolean = false;
        const handlePointerDown = (e: PointerEvent) => {
            dragging = true;
            document.body.style.cssText = "cursor: col-resize !important";
        };

        const handlePointerUp = () => {
            dragging = false;
            document.body.style.cssText = "cursor: default";
        };

        const handleColumnPointerMove = (e: PointerEvent) => {
            if (!dragging) {
                return;
            }

            if (!ref.current) {
                return;
            }

            const rect = ref.current.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;

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
    }, []);

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
                width: width,
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
            <div className="SpreadSheetEditor__column-resize-handle" ref={resizeHandleRef} />
        </th>
    );
};
