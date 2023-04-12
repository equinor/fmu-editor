import React from "react";

import {ContextMenu, ContextMenuTemplate} from "@components/ContextMenu";

export type RowHeaderProps = {
    absoluteIndex: number;
    height: number;
    width: number;
    className: string;
    onInsert: (absoluteIndex: number) => void;
    onDelete: (absoluteIndex: number) => void;
};

export const RowHeader: React.FC<RowHeaderProps> = props => {
    const ref = React.useRef<HTMLTableCellElement | null>(null);

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
            key={`vertical-header-${props.absoluteIndex}`}
            style={{
                width: props.width,
                minHeight: props.height,
                height: props.height,
            }}
            className={props.className}
            data-row-index={props.absoluteIndex}
            ref={ref}
        >
            <ContextMenu parent={ref.current} template={contextMenuTemplate} />
            {props.children}
            <div className="SpreadSheetEditor__row-resize-handle" />
        </td>
    );
};
