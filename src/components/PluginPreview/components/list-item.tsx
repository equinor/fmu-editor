import {
    Abc,
    DataArray,
    DataObject,
    Numbers,
    Remove,
    ToggleOn,
} from "@mui/icons-material";

import React from "react";

import {OverflowEllipsis} from "@components/OverflowEllipsis";

import "./list-item.css";

export type ListItemProps = {
    type: "string" | "number" | "array" | "object" | "boolean" | "list-item";
    name: string;
    value?: string;
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
};

export const ListItem: React.FC<ListItemProps> = props => {
    return (
        <div
            className={`ListItem${
                props.className ? ` ${props.className}` : ""
            }`}
            onClick={props.onClick}
        >
            {props.type === "string" && <Abc />}
            {props.type === "number" && <Numbers />}
            {props.type === "array" && <DataArray />}
            {props.type === "object" && <DataObject />}
            {props.type === "boolean" && <ToggleOn />}
            {props.type === "list-item" && <Remove />}
            <div>{props.name}</div>
            {props.value && <OverflowEllipsis text={props.value || ""} />}
        </div>
    );
};
