import {
    Abc,
    DataArray,
    DataObject,
    ExpandLess,
    ExpandMore,
    Numbers,
    Person,
    QuestionMark,
    ToggleOn,
} from "@mui/icons-material";
import {
    Avatar,
    Button,
    Collapse,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    TextField,
    useTheme,
} from "@mui/material";
import "@pathofdev/react-tag-input/build/index.css";
import {usePluginParser} from "@services/plugin-parser";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import ReactMarkdown from "react-markdown";
import {monaco} from "react-monaco-editor";

import {Plugin} from "@utils/plugin-parser";
import {LayoutObject, PluginArgumentObject} from "@utils/yaml-parser";

import {PreviewMode} from "@components/LivePreview/live-preview";

import {useAppDispatch, useAppSelector} from "@redux/hooks";

import {EventSource} from "@shared-types/files";

import "./plugin-visualizer.css";

export type PluginVisualizerType = {
    pluginData: LayoutObject;
    mode: PreviewMode;
};

export const PluginVisualizer: React.FC<PluginVisualizerType> = props => {
    const [selected, setSelected] = React.useState<boolean>(false);
    const theme = useTheme();
    const pluginParserService = usePluginParser();
    const [openStates, setOpenStates] = React.useState<{
        [key: string]: boolean;
    }>({});

    const yamlParser = useYamlParser();

    const dispatch = useAppDispatch();
    const file = useAppSelector(state =>
        state.files.files.find(el => el.filePath === state.files.activeFile)
    );

    React.useEffect(() => {
        if (
            file?.selectedYamlObject?.startLineNumber ===
                props.pluginData.startLineNumber &&
            file?.selectedYamlObject.endLineNumber ===
                props.pluginData.endLineNumber
        ) {
            setSelected(true);
        } else {
            setSelected(false);
        }
    }, [file?.selectedYamlObject, setSelected, props]);

    const selectPlugin = () => {
        yamlParser.updateSelection(
            new monaco.Selection(
                props.pluginData.startLineNumber,
                0,
                props.pluginData.endLineNumber,
                0
            ),
            EventSource.Preview
        );
    };

    const getIndent = (line: string): string => {
        let indent = 0;
        while (line.charAt(indent) === " ") {
            indent++;
        }
        return line.substring(0, indent);
    };

    /*
    const handleValueChanged = (
        data: LayoutObject,
        argument: PluginArgumentObject | undefined,
        key: string,
        newValue: any
    ) => {
        if (!data) {
            return;
        }
        let contentLines = file?.editorModel.getValue().split("\n") || [];
        if (argument) {
            contentLines[argument.startLineNumber - 1] = contentLines[
                argument.startLineNumber - 1
            ].replace(
                new RegExp(`${argument.name}: [^\n]*`),
                `${argument.name}: ${newValue}`
            );
        } else {
            const lastChild = data.children[data.children.length - 1];
            contentLines.splice(
                lastChild.endLineNumber,
                0,
                `${getIndent(
                    contentLines[lastChild.endLineNumber - 1]
                )}${key}: ${newValue}`
            );
            const lastIds = lastChild.id.split("-");
            const object: PluginArgumentObject = {
                id: `${lastIds[0]}-${parseInt(lastIds[1], 10) + 1}`,
                startLineNumber: lastChild.startLineNumber + 1,
                endLineNumber: lastChild.startLineNumber + 2,
                name: key,
                value: newValue,
            };
            (data.children as PluginArgumentObject[]).push(object);
        }
        if (file) {
            file.editorModel.setValue(contentLines.join("\n"));
            yamlParser.parseAndSetSelection(contentLines.join("\n"), new monaco.Selection(
                data.startLineNumber,
                0,
                data.endLineNumber,
                0
            ));
        }
    };

    const handleInputFocus = (
        e: any,
        argument: PluginArgumentObject | undefined
    ) => {
        if (!argument) {
            return;
        }
        store.dispatch({
            type: FilesStore.StoreActions.UpdateSelection,
            payload: {
                selection: new monaco.Selection(
                    argument.startLineNumber,
                    0,
                    argument.endLineNumber,
                    0
                ),
                source: FilesStore.UpdateSource.Plugin,
            },
        });
    };

    const makeInput = (
        data: LayoutObject,
        argument: PluginArgumentObject | undefined,
        key: string,
        type: string,
        required: boolean,
        value?: any,
        properties?: any
    ): React.ReactNode => {
        switch (type) {
            case "string":
                return (
                    <TextField
                        defaultValue={value}
                        required={required}
                        onChange={e =>
                            handleValueChanged(
                                data,
                                argument,
                                key,
                                e.target.value
                            )
                        }
                        onFocus={e => handleInputFocus(e, argument)}
                        onClick={e => e.stopPropagation()}
                    />
                );
            case "boolean":
                return (
                    <Switch
                        defaultChecked={value === "True"}
                        required={required}
                        onChange={e =>
                            handleValueChanged(
                                data,
                                argument,
                                key,
                                e.target.checked ? "True" : "False"
                            )
                        }
                    />
                );
            case "integer":
                return (
                    <TextField
                        required={required}
                        inputProps={{inputMode: "numeric", pattern: "[0-9]*"}}
                        type="number"
                        defaultValue={value}
                        onFocus={e => handleInputFocus(e, argument)}
                        onClick={e => e.stopPropagation()}
                    />
                );
            case "array":
                return (
                    <ReactTagInput
                        tags={(argument?.value as string[]) || []}
                        placeholder="Type and press enter..."
                        onChange={() => {}}
                    />
                );
            case "object":
                return (
                    <Button
                        onClick={() => {
                            const newOpenStates = openStates;
                            newOpenStates[key] = !openStates[key];
                            setOpenStates(newOpenStates);
                        }}
                    >
                        {openStates[key] ? <ExpandLess /> : <ExpandMore />}
                    </Button>
                );
            default:
                return <></>;
        }
    };
    */

    const makeView = (
        key: string,
        type: string,
        value?: any
    ): React.ReactNode => {
        switch (type) {
            case "string":
            case "boolean":
            case "integer":
                return value;
            case "array":
                return (
                    <Button
                        onClick={() => {
                            const newOpenStates = openStates;
                            newOpenStates[key] = !openStates[key];
                            setOpenStates(newOpenStates);
                        }}
                    >
                        {openStates[key] ? <ExpandLess /> : <ExpandMore />}
                    </Button>
                );
            case "list":
                return JSON.stringify(value);
            case "object":
                return (
                    <Button
                        onClick={() => {
                            const newOpenStates = openStates;
                            newOpenStates[key] = !openStates[key];
                            setOpenStates(newOpenStates);
                        }}
                    >
                        {openStates[key] ? <ExpandLess /> : <ExpandMore />}
                    </Button>
                );
            default:
                return <></>;
        }
    };

    const makeIcon = (type: string, name: string): React.ReactNode => {
        switch (type) {
            case "string":
                return <Abc />;
            case "boolean":
                return <ToggleOn />;
            case "integer":
                return <Numbers />;
            case "array":
                return <DataArray />;
            case "object":
                if (name === "contact_person") {
                    return <Person />;
                }
                return <DataObject />;

            default:
                return <QuestionMark />;
        }
    };

    const makeArgument = (
        data: LayoutObject,
        key: string,
        value: any,
        plugin: Plugin
    ) => {
        if (
            props.mode === PreviewMode.Edit ||
            (data.children as PluginArgumentObject[]).find(
                el => el.name === key
            )?.value !== undefined
        ) {
            const isSelected =
                file?.selectedYamlObject &&
                "name" in file.selectedYamlObject &&
                "value" in file.selectedYamlObject &&
                file.selectedYamlObject["name"] === key;

            const argument = (data.children as PluginArgumentObject[]).find(
                el => el.name === key
            );
            return (
                <>
                    <ListItem
                        secondaryAction={makeView(
                            key,
                            value.type,
                            argument?.value
                        )}
                        className={isSelected ? "Plugin--selected" : ""}
                    >
                        <ListItemAvatar>
                            <Avatar>{makeIcon(value.type, key)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${key}${
                                plugin.requiredProperties !== undefined &&
                                plugin.requiredProperties.includes(key)
                                    ? "*"
                                    : ""
                            }`}
                            secondary="description"
                        />
                    </ListItem>
                    {(value.type === "object" || value.type === "array") && (
                        <Collapse
                            in={openStates[key]}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div" disablePadding sx={{pl: 4}}>
                                {props.mode === PreviewMode.Edit &&
                                    "properties" in value &&
                                    Object.entries(value["properties"]).map(
                                        ([k, v]) =>
                                            makeArgument(data, k, v, plugin)
                                    )}
                                {props.mode === PreviewMode.View &&
                                    value.type === "object" &&
                                    argument &&
                                    Object.entries(argument.value).map(
                                        ([k, v]) =>
                                            makeSubArgument(
                                                v["name"],
                                                v["value"]
                                            )
                                    )}
                                {props.mode === PreviewMode.View &&
                                    value.type === "array" &&
                                    argument &&
                                    makeArray(argument.value as any[])}
                            </List>
                        </Collapse>
                    )}
                </>
            );
        }
        return <></>;
    };

    const makeArray = (array: any[]) => {
        return (
            <ul>
                {array.map(el => (
                    <li>{el}</li>
                ))}
            </ul>
        );
    };

    const makeSubArgument = (key: string, value: any) => {
        const isSelected =
            file?.selectedYamlObject &&
            "name" in file.selectedYamlObject &&
            "value" in file.selectedYamlObject &&
            file.selectedYamlObject["name"] === key;

        const type =
            value.constructor === Array
                ? "array"
                : value.constructor === Object
                ? "object"
                : typeof value;

        let argument;
        if (type === "object" && "children" in value) {
            argument = (value.children as PluginArgumentObject[]).find(
                el => el.name === key
            );
        }
        return (
            <>
                <ListItem
                    secondaryAction={
                        props.mode === PreviewMode.View &&
                        makeView(key, type, value)
                    }
                    className={isSelected ? "Plugin--selected" : ""}
                >
                    <ListItemAvatar>
                        <Avatar>{makeIcon(type, key)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={key} secondary="description" />
                </ListItem>
                {(type === "object" || type === "array") && (
                    <Collapse in={openStates[key]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{pl: 4}}>
                            {props.mode === PreviewMode.View &&
                                type === "object" &&
                                argument &&
                                Object.entries(argument.value).map(([k, v]) =>
                                    makeSubArgument(v["name"], v["value"])
                                )}
                            {props.mode === PreviewMode.View &&
                                type === "array" &&
                                makeArray(value as any[])}
                        </List>
                    </Collapse>
                )}
            </>
        );
    };

    const renderPlugin = (data: LayoutObject): React.ReactNode => {
        if (data.type === "PLAINTEXT") {
            return (
                <>
                    <h3>Text</h3>
                    <span className="PluginDescription">Plain text</span>
                    {props.mode === PreviewMode.Edit ? (
                        <TextField
                            multiline
                            defaultValue={data.name}
                            style={{width: "100%"}}
                        />
                    ) : (
                        data.name
                    )}
                </>
            );
        }

        if (data.name) {
            const plugin = pluginParserService.pluginParser.getPlugin(
                data.name
            );
            if (!plugin) {
                return <></>;
            }
            return (
                <>
                    <h3>{data.name}</h3>
                    <span className="PluginDescription">
                        <ReactMarkdown>
                            {plugin?.description || ""}
                        </ReactMarkdown>
                    </span>
                    <List>
                        {plugin.properties &&
                            Object.entries(plugin.properties).map(
                                ([key, value], index) =>
                                    makeArgument(data, key, value, plugin)
                            )}
                    </List>
                </>
            );
        }
        return <></>;
    };

    return (
        <Paper
            className={`Plugin${selected ? " Plugin--selected" : ""}`}
            onClick={selectPlugin}
        >
            {renderPlugin(props.pluginData)}
        </Paper>
    );
};
