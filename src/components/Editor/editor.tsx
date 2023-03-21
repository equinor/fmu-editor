import {useYamlSchemas} from "@hooks/useYamlSchema";
import {Button, IconButton, Typography, useTheme} from "@mui/material";
import useSize from "@react-hook/size";

import {ipcRenderer} from "electron";

import React from "react";
import {VscCloseAll, VscError, VscPreview, VscSourceControl} from "react-icons/vsc";
import MonacoEditor, {EditorDidMount, EditorWillUnmount, monaco} from "react-monaco-editor";

import {FileBasic} from "@utils/file-system/basic";
import {File} from "@utils/file-system/file";

import {FileTabs} from "@components/FileTabs";
import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {IssuesList} from "@components/IssuesList";
import {Preview} from "@components/Preview";
import {ResizablePanels} from "@components/ResizablePanels";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {closeAllFiles, setActiveFile, setEditorViewState, setValue} from "@redux/reducers/files";
import {setActiveItemPath, setPreviewOpen, setView} from "@redux/reducers/ui";
import {openFile} from "@redux/thunks";

import {CodeEditorViewState} from "@shared-types/files";
import {IpcMessages} from "@shared-types/ipc";
import {View} from "@shared-types/ui";

import {setDiagnosticsOptions as setErtOptions} from "@languages/monaco-ert/src";

import FmuLogo from "@assets/fmu-logo.svg";

// @ts-ignore
import {languages} from "monaco-editor";
import path from "path";

import "./editor.css";

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

type EditorProps = {};

export const Editor: React.FC<EditorProps> = () => {
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [userFilePath, setUserFilePath] = React.useState<string | null>(null);
    const [lastActiveFile, setLastActiveFile] = React.useState<string | null>(null);
    const [fileExists, setFileExists] = React.useState<boolean>(true);
    const [dragOver, setDragOver] = React.useState<boolean>(false);

    const monacoEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);

    const [editorTotalWidth, editorTotalHeight] = useSize(editorRef);

    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();
    const dispatch = useAppDispatch();

    const files = useAppSelector(state => state.files.files);
    const activeFile = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const fontSize = useAppSelector(state => state.ui.settings.editorFontSize);
    const view = useAppSelector(state => state.ui.view);
    const previewVisible = useAppSelector(state => state.ui.previewOpen);
    const globalSettings = useGlobalSettings();

    useYamlSchemas(yaml);
    setErtOptions();

    React.useEffect(() => {
        const timeoutRef = timeout.current;
        return () => {
            if (timeoutRef) {
                clearTimeout(timeoutRef);
            }
        };
    }, []);

    const handleFileChange = React.useCallback(
        (filePath: string) => {
            if (monacoEditorRef.current) {
                dispatch(
                    setActiveFile({
                        filePath,
                        viewState:
                            view === View.Editor ? convertFromViewState(monacoEditorRef.current.saveViewState()) : null,
                    })
                );
                dispatch(setActiveItemPath(filePath));
            }
        },
        [view, dispatch]
    );

    const handleEditorValueChange = (e: monaco.editor.IModelContentChangedEvent) => {
        if (e.isFlush) {
            return;
        }
        const model = monacoEditorRef.current?.getModel();
        if (model) {
            dispatch(setValue(model.getValue()));
        }
    };

    const handleEditorViewStateChanged = () => {
        if (monacoEditorRef.current) {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }

            timeout.current = setTimeout(() => {
                if (monacoEditorRef.current) {
                    dispatch(setEditorViewState(convertFromViewState(monacoEditorRef.current.saveViewState())));
                }
            }, 500);
        }
    };

    const handleEditorDidMount: EditorDidMount = (editor, monacoInstance) => {
        monacoEditorRef.current = editor;
        monacoRef.current = monacoInstance;
        monacoEditorRef.current.onDidChangeModelContent(handleEditorValueChange);
        monacoEditorRef.current.onDidChangeCursorPosition(handleEditorViewStateChanged);
        monacoEditorRef.current.onDidChangeCursorSelection(handleEditorViewStateChanged);
        monacoEditorRef.current.onDidLayoutChange(handleEditorViewStateChanged);
        monacoEditorRef.current.onDidScrollChange(handleEditorViewStateChanged);
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
            setLastActiveFile(null);
            setNoModels(true);
            return;
        }

        if (lastActiveFile === activeFile) {
            return;
        }
        setLastActiveFile(activeFile);

        if (file) {
            const currentFile = new File(path.relative(workingDirectoryPath, file.filePath), workingDirectoryPath);
            if (!currentFile.exists()) {
                setFileExists(false);
                return;
            }
            setFileExists(true);
            setUserFilePath(currentFile.relativePath());
            let userModel = monaco.editor.getModel(monaco.Uri.file(currentFile.absolutePath()));
            if (!userModel) {
                userModel = monaco.editor.createModel(
                    currentFile.readString(),
                    globalSettings.languageForFileExtension(path.extname(currentFile.absolutePath())),
                    monaco.Uri.file(currentFile.absolutePath())
                );
            }
            if (userModel) {
                if (monacoEditorRef.current && monacoRef.current && view === View.Editor) {
                    monacoEditorRef.current.setModel(userModel);
                    monacoEditorRef.current.focus();
                }
            }

            monacoEditorRef.current.restoreViewState(file.editorViewState);
        }

        setNoModels(false);
    }, [activeFile, files, view, globalSettings, lastActiveFile, workingDirectoryPath]);

    React.useEffect(() => {
        if (noModels) {
            ipcRenderer.send(IpcMessages.DISABLE_SAVE_ACTIONS);
        } else {
            ipcRenderer.send(IpcMessages.ENABLE_SAVE_ACTIONS);
        }
    });

    const handleFileSourceControlClick = React.useCallback(() => {
        dispatch(setView(View.SingleFileChanges));
    }, [dispatch]);

    const handleTogglePreview = React.useCallback(() => {
        dispatch(setPreviewOpen(!previewVisible));
    }, [dispatch, previewVisible]);

    const handleCloseAllEditors = React.useCallback(() => {
        dispatch(closeAllFiles());
        setLastActiveFile(null);
    }, [dispatch]);

    const createFile = React.useCallback(() => {
        const currentFile = new File(path.relative(workingDirectoryPath, activeFile), workingDirectoryPath);
        if (currentFile.writeString("")) {
            setFileExists(currentFile.exists());
        }
    }, [activeFile, workingDirectoryPath]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const droppedAsset = new FileBasic(e.dataTransfer.getData("text/plain"), workingDirectoryPath);
            if (droppedAsset.exists() && !droppedAsset.isDirectory()) {
                openFile(droppedAsset.absolutePath(), workingDirectoryPath, dispatch, globalSettings);
            }
        },
        [dispatch, globalSettings, workingDirectoryPath]
    );

    return (
        <div className="EditorWrapper" onDragOver={handleDragOver}>
            <div className="EditorContainer">
                <div
                    className="Editor__NoModels"
                    style={{
                        display: noModels ? "flex" : "none",
                    }}
                    onDragOver={handleDragOver}
                >
                    <img src={FmuLogo} alt="FMU Logo" />
                    <Typography variant="h6">FMU Editor</Typography>
                    <Typography variant="body1">Please select a file...</Typography>
                </div>
                <div
                    className="Editor__DragOver"
                    style={{display: dragOver ? "flex" : "none"}}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                >
                    Drop into editor to open file
                </div>
                <div className="EditorContainer" style={{display: !noModels ? "flex" : "none"}}>
                    <ResizablePanels direction="vertical" id="Editor-Issues" minSizes={[0, 80]}>
                        <div className="Editor">
                            <FileTabs
                                onFileChange={handleFileChange}
                                actions={
                                    <>
                                        <IconButton
                                            color="inherit"
                                            onClick={() => handleCloseAllEditors()}
                                            title="Close all open editors"
                                        >
                                            <VscCloseAll />
                                        </IconButton>
                                        <IconButton
                                            color={previewVisible ? "primary" : "inherit"}
                                            onClick={() => handleTogglePreview()}
                                            title="Open preview for current file"
                                        >
                                            <VscPreview />
                                        </IconButton>
                                        <IconButton
                                            color="inherit"
                                            onClick={() => handleFileSourceControlClick()}
                                            title="Open source control for current file"
                                        >
                                            <VscSourceControl />
                                        </IconButton>
                                    </>
                                }
                            />
                            <ResizablePanels
                                direction="horizontal"
                                id="Editor-Preview"
                                minSizes={[100, 200]}
                                visible={[true, previewVisible]}
                            >
                                <div style={{height: "100%"}}>
                                    <div
                                        className="Editor__FileNotFound"
                                        style={{
                                            display: !fileExists ? "flex" : "none",
                                        }}
                                    >
                                        <VscError style={{fontSize: 64, color: theme.palette.error.main}} />
                                        <Typography variant="h6">File not found</Typography>
                                        <Button onClick={() => createFile()} color="primary">
                                            Create file now
                                        </Button>
                                    </div>
                                    <div
                                        ref={editorRef}
                                        className="Editor"
                                        style={{display: fileExists ? "block" : "none"}}
                                    >
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
                                            height={editorTotalHeight - 2}
                                        />
                                    </div>
                                </div>
                                <Preview filePath={userFilePath} />
                            </ResizablePanels>
                        </div>
                        <IssuesList monacoRef={monacoRef} monacoEditorRef={monacoEditorRef} visible={noModels} />
                    </ResizablePanels>
                </div>
            </div>
        </div>
    );
};
