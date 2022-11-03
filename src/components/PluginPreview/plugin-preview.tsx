import {Warning} from "@mui/icons-material";
import {Chip, Paper} from "@mui/material";
import {usePluginParser} from "@services/plugin-parser";
import {useYamlParser} from "@services/yaml-parser";

import React from "react";
import ReactMarkdown from "react-markdown";
import {monaco} from "react-monaco-editor";

import {LayoutObject, PluginArgumentObject} from "@utils/yaml-parser";

import {ReadMore} from "@components/ReadMore";

import {useAppSelector} from "@redux/hooks";

import {EventSource} from "@shared-types/files";

import {ArrayPluginArgumentObject, ArrayView} from "./components/array-view";
import {IntegerView} from "./components/integer-view";
import {List} from "./components/list";
import {ObjectPluginArgumentObject, ObjectView} from "./components/object-view";
import {StringView} from "./components/string-view";
import "./plugin-preview.css";

type PluginPreviewProps = {
    data: LayoutObject;
};

export const PluginPreview: React.FC<PluginPreviewProps> = props => {
    const [selected, setSelected] = React.useState<boolean>(false);

    const yamlParser = useYamlParser();
    const pluginParser = usePluginParser();

    const file = useAppSelector(state =>
        state.files.files.find(el => el.filePath === state.files.activeFile)
    );

    const selectPlugin = () => {
        yamlParser.updateSelection(
            new monaco.Selection(
                props.data.startLineNumber,
                0,
                props.data.endLineNumber,
                0
            ),
            EventSource.Preview
        );
    };

    React.useEffect(() => {
        if (!file || !file?.selectedYamlObject) {
            setSelected(false);
            return;
        }
        if (
            file.selectedYamlObject.startLineNumber >=
                props.data.startLineNumber &&
            file.selectedYamlObject.endLineNumber <= props.data.endLineNumber
        ) {
            setSelected(true);
        } else {
            setSelected(false);
        }
    }, [file, setSelected, props]);

    let title = "Text";
    let description = "Plain text";
    let content: string | object | undefined = props.data.name;

    if (props.data.name && props.data.type !== "PLAINTEXT") {
        const plugin = pluginParser.pluginParser.getPlugin(props.data.name);
        title = props.data.name;
        description = plugin?.description || "";
        content = plugin?.properties || "";
    }

    return (
        <Paper
            className={`Plugin${selected ? " Plugin--selected" : ""}`}
            onClick={selectPlugin}
        >
            <h3>{title}</h3>
            <span className="PluginDescription">
                {content !== "" ? (
                    <ReadMore minHeight={100} initiallyOpen={false}>
                        <ReactMarkdown>{description}</ReactMarkdown>
                    </ReadMore>
                ) : (
                    <Chip
                        label="Could not find this plugin in your Webviz schema file."
                        color="warning"
                        icon={<Warning />}
                    />
                )}
            </span>
            <List>
                {content && content.constructor === Object
                    ? Object.entries(content).map(([key, value]) => {
                          const data = (
                              props.data.children as PluginArgumentObject[]
                          ).find(el => el.name === key);
                          if (!data) {
                              return <></>;
                          }
                          switch (value.type) {
                              case "string":
                                  return (
                                      <StringView
                                          key={key}
                                          name={key}
                                          value={data}
                                      />
                                  );
                              case "integer":
                                  return (
                                      <IntegerView
                                          key={key}
                                          name={key}
                                          value={data}
                                      />
                                  );
                              case "object":
                                  return (
                                      <ObjectView
                                          key={key}
                                          name={key}
                                          value={
                                              data as ObjectPluginArgumentObject
                                          }
                                      />
                                  );
                              case "array":
                                  return (
                                      <ArrayView
                                          key={key}
                                          name={key}
                                          value={
                                              data as ArrayPluginArgumentObject
                                          }
                                      />
                                  );
                              default:
                                  return <></>;
                          }
                      })
                    : content}
            </List>
        </Paper>
    );
};
