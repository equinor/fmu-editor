import {useYamlSchemas} from "@hooks/useYamlSchema";
import {Close} from "@mui/icons-material";
import {IconButton, Typography, useTheme} from "@mui/material";
import useSize from "@react-hook/size";
import {useFileManager} from "@services/file-manager";

import {ipcRenderer} from "electron";

import React from "react";
import {DiffEditorDidMount, MonacoDiffEditor, monaco} from "react-monaco-editor";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveFile, setValue} from "@redux/reducers/files";

import {CodeEditorViewState} from "@shared-types/files";
import {Page} from "@shared-types/ui";

import fs from "fs";
// @ts-ignore
import {languages} from "monaco-editor";

import "./diff-editor.css";

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

// @ts-ignore
const {yaml} = languages || {};

type EditorProps = {
    file: string | null;
    onClose: () => void;
};

export const DiffEditor: React.FC<EditorProps> = props => {
    const [visible, setVisible] = React.useState<boolean>(false);
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [selection, setSelection] = React.useState<monaco.ISelection | null>(null);
    const [lineDecorations, setLineDecorations] = React.useState<string[]>([]);
    const [markers, setMarkers] = React.useState<monaco.editor.IMarker[]>([]);
    const parserTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [models, setModels] = React.useState<monaco.editor.ITextModel[]>([]);

    const monacoEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoDiffEditorRef = React.useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const diffEditorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);
    const monacoDiffRef = React.useRef<typeof monaco | null>(null);

    const [editorTotalWidth, editorTotalHeight] = useSize(editorRef);
    const [diffEditorTotalWidth, diffEditorTotalHeight] = useSize(diffEditorRef);

    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();
    const dispatch = useAppDispatch();

    const files = useAppSelector(state => state.files.files);
    const activeFile = useAppSelector(state => state.files.activeFile);
    const fontSize = useAppSelector(state => state.ui.settings.editorFontSize);
    const editorMode = useAppSelector(state => state.ui.page);
    const fileManager = useFileManager();

    useYamlSchemas(yaml);

    React.useEffect(() => {
        const timeoutRef = timeout.current;
        return () => {
            if (timeoutRef) {
                clearTimeout(timeoutRef);
            }
        };
    }, [timeout]);

    /*

    const handleCursorPositionChange = (e: monaco.editor.ICursorPositionChangedEvent): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !== e.position.lineNumber ||
            selection.positionLineNumber !== e.position.lineNumber ||
            selection.selectionStartColumn !== e.position.column ||
            selection.positionColumn !== e.position.column
        ) {
            setSelection(
                new monaco.Selection(e.position.lineNumber, e.position.column, e.position.lineNumber, e.position.column)
            );
            if (e.reason === monaco.editor.CursorChangeReason.ContentFlush) {
                return;
            }
            yamlParser.updateSelection(
                new monaco.Selection(
                    e.position.lineNumber,
                    e.position.column,
                    e.position.lineNumber,
                    e.position.column
                ),
                EventSource.Editor
            );
            if (monacoEditorRef.current) {
                dispatch(setEditorViewState(convertFromViewState(monacoEditorRef.current.saveViewState())));
            }
        }
    };

    const handleCursorSelectionChange = (e: monaco.editor.ICursorSelectionChangedEvent): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !== e.selection.selectionStartLineNumber ||
            selection.positionLineNumber !== e.selection.positionLineNumber ||
            selection.selectionStartColumn !== e.selection.selectionStartColumn ||
            selection.positionColumn !== e.selection.positionColumn
        ) {
            setSelection(e.selection);
            if (e.reason === monaco.editor.CursorChangeReason.ContentFlush) {
                return;
            }
            yamlParser.updateSelection(e.selection, EventSource.Editor);
            if (monacoEditorRef.current) {
                dispatch(setEditorViewState(convertFromViewState(monacoEditorRef.current.saveViewState())));
            }
        }
    };

    const updateLineDecorations = React.useCallback(
        (newDecorations: monaco.editor.IModelDeltaDecoration[]) => {
            if (!monacoEditorRef.current) {
                return;
            }
            setLineDecorations(monacoEditorRef.current.deltaDecorations(lineDecorations, newDecorations));
        },
        [lineDecorations]
    );

    */

    const handleFileChange = (filePath: string) => {
        if (monacoEditorRef.current) {
            dispatch(
                setActiveFile({
                    filePath,
                    viewState:
                        editorMode === Page.Editor
                            ? convertFromViewState(monacoEditorRef.current.saveViewState())
                            : null,
                })
            );
        }
        // setTimeout(handleMarkersChange, 2000);
    };

    const handleEditorValueChange = (e: monaco.editor.IModelContentChangedEvent) => {
        if (e.isFlush) {
            return;
        }
        const model = monacoEditorRef.current?.getModel();
        if (model) {
            dispatch(setValue(model.getValue()));
        }
    };

    /*

    const handleMarkersChange = () => {
        if (!monacoRef.current || !monacoEditorRef.current) {
            return;
        }
        setMarkers(
            monacoRef.current.editor.getModelMarkers({
                resource: monacoEditorRef.current.getModel()?.uri,
            })
        );
    };

    const handleEditorViewStateChanged = () => {
        if (monacoEditorRef.current) {
            dispatch(setEditorViewState(convertFromViewState(monacoEditorRef.current.saveViewState())));
        }
    };
    */

    const handleDiffEditorDidMount: DiffEditorDidMount = (editor, monacoInstance) => {
        monacoDiffEditorRef.current = editor;
        monacoDiffRef.current = monacoInstance;
    };

    React.useEffect(() => {
        if (!monacoEditorRef || !monacoEditorRef.current) {
            return;
        }
        monacoEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoEditorRef]);

    React.useEffect(() => {
        const file = props.file;
        if (file === null) {
            setNoModels(true);
            monacoDiffEditorRef.current?.setModel({
                original: monaco.editor.createModel("", "yaml"),
                modified: monaco.editor.createModel("", "yaml"),
            });
            setVisible(false);
            return;
        }

        setVisible(true);

        if (file) {
            let userModel = monaco.editor.getModel(monaco.Uri.file(file));
            if (!userModel) {
                userModel = monaco.editor.createModel(fs.readFileSync(file).toString(), "yaml", monaco.Uri.file(file));
            } else {
                userModel.setValue(fs.readFileSync(file).toString());
            }
            const originalFilePath = fileManager.fileManager.getOriginalFileIfExists(file);
            let diffModel = monaco.editor.getModel(monaco.Uri.file(originalFilePath));
            if (!diffModel) {
                diffModel = monaco.editor.createModel(
                    fs.readFileSync(originalFilePath).toString(),
                    "yaml",
                    monaco.Uri.file(originalFilePath)
                );
            } else {
                diffModel.setValue(fs.readFileSync(originalFilePath).toString());
            }
            if (userModel) {
                if (monacoDiffEditorRef.current && monacoDiffRef.current) {
                    monacoDiffEditorRef.current.setModel({
                        original: diffModel ?? userModel,
                        modified: userModel,
                    });
                    monacoDiffEditorRef.current.focus();
                }
            }
        }

        setNoModels(false);
    }, [props.file, fileManager]);

    React.useEffect(() => {
        if (noModels) {
            ipcRenderer.send("disable-save-actions");
        } else {
            ipcRenderer.send("enable-save-actions");
        }
    });

    return (
        <div
            className="EditorWrapper"
            style={{
                backgroundColor: theme.palette.mode === "dark" ? "#1E1E1E" : theme.palette.background.default,
            }}
        >
            <div
                className="Editor__NoModels"
                style={{
                    visibility: !visible ? "visible" : "hidden",
                }}
            >
                <Typography variant="h6">FMU Editor</Typography>
                <Typography variant="body1">Please select a file...</Typography>
            </div>
            <div ref={diffEditorRef} className="EditorContainer" style={{display: visible ? "block" : "none"}}>
                <div className="DiffEditorHeader">
                    {props.file}
                    <IconButton
                        onClick={() => {
                            props.onClose();
                            setVisible(false);
                        }}
                    >
                        <Close />
                    </IconButton>
                </div>
                <MonacoDiffEditor
                    language="yaml"
                    defaultValue=""
                    className="YamlEditor"
                    editorDidMount={handleDiffEditorDidMount}
                    theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                    options={{
                        readOnly: true,
                    }}
                    width={diffEditorTotalWidth}
                    height={diffEditorTotalHeight - 56}
                />
            </div>
        </div>
    );
};
