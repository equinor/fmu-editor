import "../plugin-preview.css";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import {monaco} from "react-monaco-editor";

import {PluginArgumentObject} from "@utils/yaml-parser";

import {useAppSelector} from "@redux/hooks";

import {EventSource} from "@shared-types/files";

import {List} from "./list";
import {ListItem} from "./list-item";

export type ArrayPluginArgumentObject = Omit<PluginArgumentObject, "value"> & {
    value: any[];
};

type ComponentsProps = {
    name: string;
    value: ArrayPluginArgumentObject;
};

export const ArrayView: React.FC<ComponentsProps> = props => {
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
        <div className={isSelected ? "Plugin--selected" : ""}>
            <ListItem
                type="array"
                onClick={e => handleClickEvent(e)}
                name={props.name}
            />
            <List indentation={24}>
                {props.value.value.map(el => {
                    return (
                        <ListItem
                            type="list-item"
                            name={JSON.stringify(el)}
                            value=""
                            onClick={e => handleClickEvent(e)}
                        />
                    );
                })}
            </List>
        </div>
    );
};
