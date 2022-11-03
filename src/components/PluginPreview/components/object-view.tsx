import "../plugin-preview.css";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import {monaco} from "react-monaco-editor";

import {PluginArgumentObject} from "@utils/yaml-parser";

import {useAppSelector} from "@redux/hooks";

import {EventSource} from "@shared-types/files";

import {isNumber} from "lodash";

import {ArrayPluginArgumentObject, ArrayView} from "./array-view";
import {BooleanView} from "./boolean-view";
import {IntegerView} from "./integer-view";
import {List} from "./list";
import {ListItem} from "./list-item";
import {StringView} from "./string-view";

export type ObjectPluginArgumentObject = Omit<PluginArgumentObject, "value"> & {
    value: PluginArgumentObject[];
};

type ComponentsProps = {
    name: string;
    value: ObjectPluginArgumentObject;
};

export const ObjectView: React.FC<ComponentsProps> = props => {
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
                type="object"
                name={props.name}
                value=""
                onClick={e => handleClickEvent(e)}
            />
            <List indentation={24}>
                {props.value.value.map(el => {
                    if (el.value.constructor === Object) {
                        return (
                            <ObjectView
                                name={el.name}
                                value={el as ObjectPluginArgumentObject}
                                key={el.name}
                            />
                        );
                    }
                    if (el.value.constructor === Array) {
                        if (
                            el.value.length > 0 &&
                            el.value[0].constructor === Object
                        ) {
                            return (
                                <ObjectView
                                    name={el.name}
                                    value={el as ObjectPluginArgumentObject}
                                    key={el.name}
                                />
                            );
                        }
                        return (
                            <ArrayView
                                name={el.name}
                                value={el as ArrayPluginArgumentObject}
                                key={el.name}
                            />
                        );
                    }
                    if (el.value.constructor === Boolean) {
                        return (
                            <BooleanView
                                name={el.name}
                                value={el}
                                key={el.name}
                            />
                        );
                    }
                    if (el.value.constructor === String) {
                        return (
                            <StringView
                                name={el.name}
                                value={el}
                                key={el.name}
                            />
                        );
                    }
                    if (isNumber(el.value)) {
                        return (
                            <IntegerView
                                name={el.name}
                                value={el}
                                key={el.name}
                            />
                        );
                    }
                    return <></>;
                })}
            </List>
        </div>
    );
};
