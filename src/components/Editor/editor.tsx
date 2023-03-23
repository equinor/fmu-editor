import {Button, IconButton, Typography, useTheme} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";
import {VscCloseAll, VscError, VscPreview, VscSourceControl} from "react-icons/vsc";
import {EditorDidMount, EditorWillUnmount, monaco} from "react-monaco-editor";

import {FileBasic} from "@utils/file-system/basic";
import {File} from "@utils/file-system/file";
import {monacoMainEditorInstances, monacoViewStateManager} from "@utils/monaco";

import {FileTabs} from "@components/FileTabs";
import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {IssuesList} from "@components/IssuesList";
import {Preview} from "@components/Preview";
import {ResizablePanels} from "@components/ResizablePanels";

import {useAppDispatch, useStrictAppSelector} from "@redux/hooks";
import {closeAllFiles, setActiveFilePath} from "@redux/reducers/files";
import {setActiveItemPath, setPreviewOpen, setView} from "@redux/reducers/ui";
import {openFile} from "@redux/thunks";

import {CodeEditorViewState} from "@shared-types/files";
import {IpcMessages} from "@shared-types/ipc";
import {View} from "@shared-types/ui";

import FmuLogo from "@assets/fmu-logo.svg";

import path from "path";

import {MonacoEditor} from "./components/monaco-editor";
import "./editor.css";

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

type EditorProps = {};

export const Editor: React.FC<EditorProps> = () => {
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [userFilePath, setUserFilePath] = React.useState<string | null>(null);
    const [lastActiveFilePath, setLastActiveFilePath] = React.useState<string | null>(null);
    const [fileExists, setFileExists] = React.useState<boolean>(true);
    const [dragOver, setDragOver] = React.useState<boolean>(false);

    const monacoEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);

    const theme = useTheme();
    const dispatch = useAppDispatch();

    const files = useStrictAppSelector(state => state.files.files);
    const activeFilePath = useStrictAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useStrictAppSelector(state => state.files.workingDirectoryPath);
    const fontSize = useStrictAppSelector(state => state.ui.settings.editorFontSize);
    const view = useStrictAppSelector(state => state.ui.view);
    const previewVisible = useStrictAppSelector(state => state.ui.previewOpen);
    const globalSettings = useGlobalSettings();

    const handleFileChange = React.useCallback(
        (filePath: string) => {
            if (monacoEditorRef.current) {
                dispatch(
                    setActiveFilePath({
                        filePath,
                    })
                );
                dispatch(setActiveItemPath(filePath));
            }
        },
        [dispatch]
    );

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
        if (!monacoEditorRef || !monacoEditorRef.current) {
            return;
        }
        monacoEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoEditorRef]);

    React.useEffect(() => {
        const file = files.find(el => el.filePath === activeFilePath);
        if (files.length === 0 || file === undefined) {
            setLastActiveFilePath(null);
            setNoModels(true);
            return;
        }

        if (lastActiveFilePath === activeFilePath) {
            return;
        }
        setLastActiveFilePath(activeFilePath);

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
                if (monacoEditorRef.current && monacoRef.current) {
                    monacoEditorRef.current.setModel(userModel);
                    monacoEditorRef.current.focus();
                }
            }
        }

        setNoModels(false);
    }, [activeFilePath, files, view, globalSettings, lastActiveFilePath, workingDirectoryPath]);

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
        setLastActiveFilePath(null);
    }, [dispatch]);

    const createFile = React.useCallback(() => {
        const currentFile = new File(path.relative(workingDirectoryPath, activeFilePath), workingDirectoryPath);
        if (currentFile.writeString("")) {
            setFileExists(currentFile.exists());
        }
    }, [activeFilePath, workingDirectoryPath]);

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
                    <ResizablePanels direction="vertical" id="editor-issues" minSizes={[0, 80]}>
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
                                id="editor-preview"
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
                                    <MonacoEditor
                                        onEditorDidMount={handleEditorDidMount}
                                        onEditorWillUnmount={handleEditorWillUnmount}
                                        visible={fileExists}
                                    />
                                </div>
                                <Preview filePath={userFilePath} />
                            </ResizablePanels>
                        </div>
                        <IssuesList visible={noModels} monacoEditorRef={monacoEditorRef} monacoRef={monacoRef} />
                    </ResizablePanels>
                </div>
            </div>
        </div>
    );
};
