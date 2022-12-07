import {useYamlSchemas} from "@hooks/useYamlSchema";
import {Error as ErrorIcon} from "@mui/icons-material";
import {Badge, Grid, Typography, useTheme} from "@mui/material";
import useSize from "@react-hook/size";
import {useFileManager} from "@services/file-manager";

import {ipcRenderer} from "electron";

import React from "react";
import {VscError, VscInfo, VscLightbulb, VscWarning} from "react-icons/vsc";
import MonacoEditor, {EditorDidMount, EditorWillUnmount, monaco} from "react-monaco-editor";

import {FileTabs} from "@components/FileTabs";
import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {ResizablePanels} from "@components/ResizablePanels";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveFile, setEditorViewState, setValue} from "@redux/reducers/files";

import {CodeEditorViewState} from "@shared-types/files";
import {Page} from "@shared-types/ui";

import FmuLogo from "@assets/fmu-logo.svg";

import fs from "fs";
// @ts-ignore
import {languages} from "monaco-editor";
import path from "path";
// @ts-ignore
import {v4} from "uuid";

import "./editor.css";

declare global {
    interface Window {
        MonacoEnvironment?: monaco.Environment;
    }
}

const compareMarkers = (a: monaco.editor.IMarker, b: monaco.editor.IMarker): number => {
    if (a.startLineNumber === b.startLineNumber) {
        return a.startColumn - b.startColumn;
    }
    return a.startLineNumber - b.startLineNumber;
};

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

type EditorProps = {};

export const Editor: React.FC<EditorProps> = () => {
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [markers, setMarkers] = React.useState<monaco.editor.IMarker[]>([]);

    const monacoEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);

    const [editorTotalWidth, editorTotalHeight] = useSize(editorRef);

    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();
    const dispatch = useAppDispatch();

    const files = useAppSelector(state => state.files.files);
    const activeFile = useAppSelector(state => state.files.activeFile);
    const fontSize = useAppSelector(state => state.ui.settings.editorFontSize);
    const editorMode = useAppSelector(state => state.ui.page);
    const fileManager = useFileManager();
    const globalSettings = useGlobalSettings();

    useYamlSchemas(yaml);

    React.useEffect(() => {
        const timeoutRef = timeout.current;
        return () => {
            if (timeoutRef) {
                clearTimeout(timeoutRef);
            }
        };
    }, [timeout]);

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

    const handleMarkersChange = () => {
        if (!monacoRef.current || !monacoEditorRef.current) {
            return;
        }
        setMarkers(
            monacoRef.current.editor
                .getModelMarkers({
                    resource: monacoEditorRef.current.getModel()?.uri,
                })
                .sort(compareMarkers)
        );
    };

    const handleEditorViewStateChanged = () => {
        if (monacoEditorRef.current) {
            dispatch(setEditorViewState(convertFromViewState(monacoEditorRef.current.saveViewState())));
        }
    };

    const handleEditorDidMount: EditorDidMount = (editor, monacoInstance) => {
        monacoEditorRef.current = editor;
        monacoRef.current = monacoInstance;
        monacoEditorRef.current.onDidChangeModelContent(handleEditorValueChange);
        // monacoEditorRef.current.onDidChangeCursorPosition(handleCursorPositionChange);
        // monacoEditorRef.current.onDidChangeCursorSelection(handleCursorSelectionChange);
        monacoRef.current.editor.onDidChangeMarkers(handleMarkersChange);
        // monacoEditorRef.current.onDidLayoutChange(handleEditorViewStateChanged);
        // monacoEditorRef.current.onDidScrollChange(handleEditorViewStateChanged);
    };

    const handleEditorWillUnmount: EditorWillUnmount = () => {
        monacoEditorRef.current?.dispose();
        monacoEditorRef.current = null;
        monacoRef.current = null;
    };

    React.useEffect(() => {
        if (!monacoEditorRef || !monacoEditorRef.current) {
            return;
        }
        monacoEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoEditorRef]);

    React.useEffect(() => {
        const file = files.find(el => el.filePath === activeFile);
        if (files.length === 0 || file === undefined) {
            setNoModels(true);
            return;
        }

        if (file) {
            const userFilePath = fileManager.fileManager.getUserFileIfExists(file.filePath);
            let userModel = monaco.editor.getModel(monaco.Uri.file(userFilePath));
            if (!userModel) {
                userModel = monaco.editor.createModel(
                    fs.readFileSync(userFilePath).toString(),
                    globalSettings.languageForFileExtension(path.extname(userFilePath)),
                    monaco.Uri.file(userFilePath)
                );
            }
            if (userModel) {
                if (monacoEditorRef.current && monacoRef.current && editorMode === Page.Editor) {
                    monacoEditorRef.current.setModel(userModel);
                    if (file.editorViewState) {
                        monacoEditorRef.current.restoreViewState(file.editorViewState);
                    }
                    monacoEditorRef.current.focus();
                }
            }
        }

        setNoModels(false);
    }, [activeFile, files, editorMode, fileManager, globalSettings]);

    const selectMarker = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, marker: monaco.editor.IMarker) => {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.setSelection(
                new monaco.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn)
            );

            monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(marker.startLineNumber, marker.endLineNumber);
        }
    };

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
            <div className="EditorContainer">
                <div
                    className="Editor__NoModels"
                    style={{
                        display: noModels ? "flex" : "none",
                    }}
                >
                    <img src={FmuLogo} alt="FMU Logo" />
                    <Typography variant="h6">FMU Editor</Typography>
                    <Typography variant="body1">Please select a file...</Typography>
                </div>
                <div className="EditorContainer" style={{display: !noModels ? "flex" : "none"}}>
                    <ResizablePanels direction="vertical" id="Editor-Issues">
                        <div ref={editorRef} className="Editor">
                            <FileTabs onFileChange={handleFileChange} />
                            <MonacoEditor
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
                                width={editorTotalWidth}
                                height={editorTotalHeight - 56}
                            />
                        </div>
                        <div className="Issues">
                            <Surface elevation="raised" className="IssuesTitle">
                                <Grid container columnSpacing={2} spacing={5} direction="row" alignItems="center">
                                    <Grid item>
                                        <Badge badgeContent={noModels ? 0 : markers.length} color="warning">
                                            <ErrorIcon color="action" />
                                        </Badge>
                                    </Grid>
                                    <Grid item>Issues</Grid>
                                </Grid>
                            </Surface>
                            <div className="IssuesContent" style={{display: noModels ? "none" : "block"}}>
                                {markers.map(marker => (
                                    <a href="#" className="Issue" onClick={e => selectMarker(e, marker)} key={v4()}>
                                        {marker.severity === monaco.MarkerSeverity.Error ? (
                                            <VscError color={theme.palette.error.main} size={16} />
                                        ) : marker.severity === monaco.MarkerSeverity.Warning ? (
                                            <VscWarning color={theme.palette.warning.main} size={16} />
                                        ) : marker.severity === monaco.MarkerSeverity.Info ? (
                                            <VscInfo color={theme.palette.info.main} size={16} />
                                        ) : (
                                            <VscLightbulb color={theme.palette.secondary.main} size={16} />
                                        )}{" "}
                                        {marker.message}
                                        <span className="IssuePosition">
                                            [Ln {marker.startLineNumber}, Col {marker.startColumn}]
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </ResizablePanels>
                </div>
            </div>
        </div>
    );
};
