import {useElementSize} from "@hooks/useElementSize";
import {useYamlSchemas} from "@hooks/useYamlSchema";
import {setDiagnosticsOptions as setErtOptions} from "@languages/monaco-ert/src";
import {useTheme} from "@mui/material";

import React from "react";
import ReactMonacoEditor, {EditorDidMount, EditorWillUnmount, monaco} from "react-monaco-editor";

// @ts-ignore
import {languages} from "monaco-editor";

declare global {
    interface Window {
        MonacoEnvironment?: monaco.Environment;
    }
}

window.MonacoEnvironment = {
    getWorker(moduleId, label) {
        switch (label) {
            case "editorWorkerService":
                return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url));
            case "css":
            case "less":
            case "scss":
                return new Worker(new URL("monaco-editor/esm/vs/language/css/css.worker", import.meta.url));
            case "handlebars":
            case "html":
            case "razor":
                return new Worker(new URL("monaco-editor/esm/vs/language/html/html.worker", import.meta.url));
            case "json":
                return new Worker(new URL("monaco-editor/esm/vs/language/json/json.worker", import.meta.url));
            case "javascript":
            case "typescript":
                return new Worker(new URL("monaco-editor/esm/vs/language/typescript/ts.worker", import.meta.url));
            case "yaml":
                return new Worker(new URL("monaco-yaml/yaml.worker", import.meta.url));
            default:
                throw new Error(`Unknown label ${label}`);
        }
    },
};

// @ts-ignore
const {yaml} = languages || {};

export type MonacoEditorProps = {
    onEditorDidMount: EditorDidMount;
    onEditorWillUnmount: EditorWillUnmount;
    visible: boolean;
};

export const MonacoEditor: React.FC<MonacoEditorProps> = props => {
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const editorSize = useElementSize(editorRef);

    const theme = useTheme();

    useYamlSchemas(yaml);
    setErtOptions();

    const handleEditorDidMount: EditorDidMount = (editor, monacoInstance) => {
        props.onEditorDidMount(editor, monacoInstance);
    };

    const handleEditorWillUnmount: EditorWillUnmount = (editor, monacoInstance) => {
        props.onEditorWillUnmount(editor, monacoInstance);
    };

    return (
        <div ref={editorRef} className="Editor" style={{display: props.visible ? "block" : "none"}}>
            <ReactMonacoEditor
                language="yaml"
                defaultValue=""
                className="YamlEditor"
                editorDidMount={handleEditorDidMount}
                editorWillUnmount={handleEditorWillUnmount}
                theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                options={{
                    tabSize: 2,
                    insertSpaces: true,
                    quickSuggestions: {other: true, strings: true},
                }}
                width={editorSize.width}
                height={editorSize.height - 2}
            />
        </div>
    );
};
