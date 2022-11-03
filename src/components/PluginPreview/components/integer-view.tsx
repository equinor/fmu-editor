import "../plugin-preview.css";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import {monaco} from "react-monaco-editor";

import {PluginArgumentObject} from "@utils/yaml-parser";

import {useAppSelector} from "@redux/hooks";

import {EventSource} from "@shared-types/files";

import {ListItem} from "./list-item";

type ComponentsProps = {
    name: string;
    value: PluginArgumentObject;
};

export const IntegerView: React.FC<ComponentsProps> = props => {
    const yamlParser = useYamlParser();

    const file = useAppSelector(state =>
        state.files.files.find(el => el.filePath === state.files.activeFile)
    );

    const isSelected =
        file?.selectedYamlObject &&
        "name" in file.selectedYamlObject &&
        "value" in file.selectedYamlObject &&
        file.selectedYamlObject["name"] === props.name;

    const handleClickEvent = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        yamlParser.updateSelection(
            new monaco.Selection(
                props.value.startLineNumber,
                0,
                props.value.endLineNumber,
                0
            ),
            EventSource.Preview
        );
    };

    return (
        <ListItem
            type="number"
            onClick={e => handleClickEvent(e)}
            name={props.name}
            value={props.value.value.toString()}
            className={isSelected ? "Plugin--selected" : ""}
        />
    );
};
