import {EditorType, GlobalSettings} from "@global/global-settings";
import {Button, IconButton, Typography, useTheme} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";
import {VscCloseAll, VscError, VscPreview, VscSourceControl} from "react-icons/vsc";

import {FileBasic} from "@utils/file-system/basic";
import {File} from "@utils/file-system/file";

import {FileTabs} from "@components/FileTabs";
import {IssuesList} from "@components/IssuesList";
import {Preview} from "@components/Preview";
import {ResizablePanels} from "@components/ResizablePanels";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {closeAllFiles, setActiveFilePath} from "@redux/reducers/files";
import {setActiveItemPath, setPreviewOpen, setView} from "@redux/reducers/ui";
import {openFile} from "@redux/thunks";

import {IpcMessages} from "@shared-types/ipc";
import {View} from "@shared-types/ui";

import FmuLogo from "@assets/fmu-logo.svg";

import path from "path";

import {MonacoEditor} from "./components/monaco-editor";
import {SpreadSheetEditor} from "./components/spreadsheet-editor";
import "./editor.css";

export const Editor: React.FC = () => {
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [userFilePath, setUserFilePath] = React.useState<string | null>(null);
    const [fileExists, setFileExists] = React.useState<boolean>(true);
    const [dragOver, setDragOver] = React.useState<boolean>(false);
    const [editorType, setEditorType] = React.useState<EditorType>(EditorType.Monaco);

    const theme = useTheme();
    const dispatch = useAppDispatch();

    const files = useAppSelector(state => state.files.files);
    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const previewVisible = useAppSelector(state => state.ui.previewOpen);

    const handleFileChange = React.useCallback(
        (filePath: string) => {
            dispatch(
                setActiveFilePath({
                    filePath,
                })
            );
            dispatch(setActiveItemPath(filePath));
        },
        [dispatch]
    );

    React.useEffect(() => {
        const file = files.find(el => el.filePath === activeFilePath);
        if (files.length === 0 || file === undefined) {
            setNoModels(true);
            return;
        }

        if (file) {
            const currentFile = new File(path.relative(workingDirectoryPath, file.filePath), workingDirectoryPath);
            if (!currentFile.exists()) {
                setFileExists(false);
                return;
            }
            setFileExists(true);
            setUserFilePath(currentFile.relativePath());
            const fileExtension = path.extname(currentFile.absolutePath());

            if (GlobalSettings.editorTypeForFileExtension(fileExtension) === EditorType.Monaco) {
                setEditorType(EditorType.Monaco);
            } else if (GlobalSettings.editorTypeForFileExtension(fileExtension) === EditorType.SpreadSheet) {
                setEditorType(EditorType.SpreadSheet);
            }
        }

        setNoModels(false);
    }, [activeFilePath, files, workingDirectoryPath]);

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
                openFile(droppedAsset.absolutePath(), workingDirectoryPath, dispatch);
            }
        },
        [dispatch, workingDirectoryPath]
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
                            <div className="EditorContent">
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
                                        <MonacoEditor visible={fileExists && editorType === EditorType.Monaco} />
                                        <SpreadSheetEditor
                                            visible={fileExists && editorType === EditorType.SpreadSheet}
                                        />
                                    </div>
                                    <Preview filePath={userFilePath} />
                                </ResizablePanels>
                            </div>
                        </div>
                        <IssuesList visible={noModels} />
                    </ResizablePanels>
                </div>
            </div>
        </div>
    );
};
