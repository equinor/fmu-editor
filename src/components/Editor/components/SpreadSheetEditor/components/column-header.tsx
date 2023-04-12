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
            key={`horizontal-header-${props.absoluteIndex}`}
            style={{
                width: props.width,
                minWidth: props.width,
                height: props.height,
            }}
            className={props.className}
            data-column-index={props.absoluteIndex}
            ref={ref}
        >
            <ContextMenu parent={ref.current} template={contextMenuTemplate} />
            {props.children}
            <div className="SpreadSheetEditor__column-resize-handle" />
        </th>
    );
};
