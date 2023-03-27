import {useElementSize} from "@hooks/useElementSize";
import {useYamlSchemas} from "@hooks/useYamlSchema";
import {setDiagnosticsOptions as setErtOptions} from "@languages/monaco-ert/src";
import {useTheme} from "@mui/material";

import React from "react";
import ReactMonacoEditor, {EditorDidMount, EditorWillUnmount, monaco} from "react-monaco-editor";

import {File} from "@utils/file-system/file";
import {monacoMainEditorInstances, monacoViewStateManager} from "@utils/monaco";

import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";

import {useAppSelector} from "@redux/hooks";

import {CodeEditorViewState} from "@shared-types/files";

// @ts-ignore
import {languages} from "monaco-editor";
import path from "path";

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

const convertFromViewState = (viewState: monaco.editor.ICodeEditorViewState | null): CodeEditorViewState | null => {
    if (!viewState) {
        return null;
    }
    return {
        ...viewState,
        viewState: {
            ...viewState.viewState,
            firstPosition: {
                column: viewState.viewState.firstPosition.column,
                lineNumber: viewState.viewState.firstPosition.lineNumber,
            },
        },
    };
};

let timeout: ReturnType<typeof setTimeout> | null = null;

const handleEditorViewStateChanged = (monacoEditorRef?: monaco.editor.IStandaloneCodeEditor) => {
    if (monacoEditorRef) {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            const model = monacoEditorRef.getModel();
            if (model) {
                const viewState = monacoEditorRef.saveViewState();
                monacoViewStateManager.setViewState(model.uri.path, convertFromViewState(viewState));
            }
        }, 100);
    }
};

const handleModelChanged = (monacoEditorRef?: monaco.editor.IStandaloneCodeEditor) => {
    if (monacoEditorRef) {
        const model = monacoEditorRef.getModel();
        if (model) {
            monacoEditorRef.restoreViewState(monacoViewStateManager.getViewState(model.uri.path));
        }
    }
};

// @ts-ignore
const {yaml} = languages || {};

export type MonacoEditorProps = {
    visible: boolean;
};

export const MonacoEditor: React.FC<MonacoEditorProps> = props => {
    const [lastActiveFilePath, setLastActiveFilePath] = React.useState<string | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const editorSize = useElementSize(editorRef);
    const monacoEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);

    const theme = useTheme();
    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const globalSettings = useGlobalSettings();

    const fontSize = useAppSelector(state => state.ui.settings.editorFontSize);

    useYamlSchemas(yaml);
    setErtOptions();

    React.useEffect(() => {
        if (!monacoEditorRef || !monacoEditorRef.current) {
            return;
        }
        monacoEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoEditorRef]);

    const handleEditorDidMount: EditorDidMount = React.useCallback((editor, monacoInstance) => {
        monacoMainEditorInstances.setMonacoEditorInstance(editor);
        monacoMainEditorInstances.setMonacoInstance(monacoInstance);

        monacoEditorRef.current = editor;
        monacoRef.current = monacoInstance;
        monacoEditorRef.current.onDidChangeModel(() => handleModelChanged(monacoEditorRef.current));
        monacoEditorRef.current.onDidChangeCursorPosition(() => handleEditorViewStateChanged(monacoEditorRef.current));
        monacoEditorRef.current.onDidChangeCursorSelection(() => handleEditorViewStateChanged(monacoEditorRef.current));
        monacoEditorRef.current.onDidScrollChange(() => handleEditorViewStateChanged(monacoEditorRef.current));
    }, []);

    const handleEditorWillUnmount: EditorWillUnmount = React.useCallback(() => {
        monacoEditorRef.current?.dispose();
        monacoEditorRef.current = null;
        monacoRef.current = null;
    }, []);

    React.useEffect(() => {
        if (lastActiveFilePath === activeFilePath) {
            return;
        }
        setLastActiveFilePath(activeFilePath);

        const currentFile = new File(path.relative(workingDirectoryPath, activeFilePath), workingDirectoryPath);
        if (!currentFile.exists()) {
            return;
        }
        let userModel = monaco.editor.getModel(monaco.Uri.file(activeFilePath));
        if (!userModel) {
            userModel = monaco.editor.createModel(
                currentFile.readString(),
                globalSettings.languageForFileExtension(path.extname(activeFilePath)),
                monaco.Uri.file(activeFilePath)
            );
        }
        if (userModel) {
            const monacoEditor = monacoMainEditorInstances.getMonacoEditorInstance();
            if (monacoEditor) {
                monacoEditor.setModel(userModel);
                monacoEditor.focus();
            }
        }
    }, [activeFilePath, globalSettings, lastActiveFilePath, workingDirectoryPath]);

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
