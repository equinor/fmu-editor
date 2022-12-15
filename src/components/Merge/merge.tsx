import {Add, Edit, Remove} from "@mui/icons-material";
import {Button, Stack, Typography} from "@mui/material";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {ResizablePanels} from "@components/ResizablePanels";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveDiffFile} from "@redux/reducers/files";

import {FileChangeType} from "@shared-types/file-changes";

import {MergeEditor} from "./components/merge-editor";

export const Merge: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);
    const {fileManager, changedFiles} = useFileManager();

    const activeDiffFile = useAppSelector(state => state.files.activeDiffFile);
    const dispatch = useAppDispatch();

    const handleFileSelected = React.useCallback(
        (file: string) => {
            dispatch(
                setActiveDiffFile({
                    relativeFilePath: fileManager.relativeFilePath(file),
                })
            );
        },
        [dispatch, fileManager]
    );

    const handleStageFile = React.useCallback(
        (e, filePath: string) => {
            e.stopPropagation();
            if (stagedFiles.includes(filePath)) {
                setStagedFiles(prev => prev.filter(el => el !== filePath));
            } else {
                setStagedFiles(prev => [...prev, filePath]);
            }
        },
        [stagedFiles]
    );

    const handleStageAll = React.useCallback(() => {
        setStagedFiles(changedFiles.filter(el => !el.mergingRequired).map(el => el.filePath));
    }, [changedFiles]);

    const handleUnstageAll = React.useCallback(() => {
        setStagedFiles([]);
    }, []);

    const handlePull = React.useCallback(() => {
        console.log("pulled");
    }, []);

    return (
        <ResizablePanels direction="horizontal" id="merge">
            <Surface elevation="raised" className="Explorer">
                <Surface elevation="raised" className="ExplorerTitle">
                    Pull changes from main folder
                </Surface>
                <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                    <div className="ChangesBrowserContentHeader">
                        Unstaged Files ({changedFiles.filter(el => !stagedFiles.includes(el.filePath)).length})
                        <Button
                            variant="contained"
                            onClick={() => handleStageAll()}
                            disabled={stagedFiles.length === changedFiles.length}
                            color="success"
                            size="small"
                        >
                            Stage all
                        </Button>
                    </div>
                    <div className="ChangesBrowserList">
                        {changedFiles
                            .filter(el => !stagedFiles.includes(el.filePath))
                            .map(fileChange => (
                                <div
                                    className={`ChangesBrowserListItem${
                                        fileChange.filePath === activeDiffFile ? " ChangesBrowserListItemSelected" : ""
                                    }`}
                                    key={fileChange.filePath}
                                    onClick={() => handleFileSelected(fileChange.filePath)}
                                >
                                    <div>
                                        {fileChange.type === FileChangeType.MODIFIED && (
                                            <Edit color="warning" fontSize="small" />
                                        )}
                                        {fileChange.type === FileChangeType.ADDED && (
                                            <Add color="success" fontSize="small" />
                                        )}
                                        {fileChange.type === FileChangeType.DELETED && (
                                            <Remove color="error" fontSize="small" />
                                        )}
                                        <span title={fileChange.filePath}>{fileChange.filePath}&lrm;</span>
                                    </div>
                                    {fileChange.mergingRequired ? (
                                        <Typography color="error">Merging required</Typography>
                                    ) : (
                                        <Button
                                            variant="text"
                                            onClick={e => handleStageFile(e, fileChange.filePath)}
                                            size="small"
                                        >
                                            Stage File
                                        </Button>
                                    )}
                                </div>
                            ))}
                    </div>
                    <div className="ChangesBrowserContentHeader">
                        Staged Files ({stagedFiles.length})
                        <Button
                            variant="contained"
                            onClick={() => handleUnstageAll()}
                            color="error"
                            size="small"
                            disabled={stagedFiles.length === 0}
                        >
                            Unstage all
                        </Button>
                    </div>
                    <div className="ChangesBrowserList">
                        {changedFiles
                            .filter(el => stagedFiles.includes(el.filePath))
                            .map(fileChange => (
                                <div
                                    className={`ChangesBrowserListItem${
                                        fileChange.filePath === activeDiffFile ? " ChangesBrowserListItemSelected" : ""
                                    }`}
                                    key={fileChange.filePath}
                                    onClick={() => handleFileSelected(fileChange.filePath)}
                                >
                                    <div>
                                        {fileChange.type === FileChangeType.MODIFIED && (
                                            <Edit color="warning" fontSize="small" />
                                        )}
                                        {fileChange.type === FileChangeType.ADDED && (
                                            <Add color="success" fontSize="small" />
                                        )}
                                        {fileChange.type === FileChangeType.DELETED && (
                                            <Remove color="error" fontSize="small" />
                                        )}
                                        <span title={fileChange.filePath}>{fileChange.filePath}</span>
                                    </div>
                                    <Button
                                        variant="text"
                                        onClick={e => handleStageFile(e, fileChange.filePath)}
                                        size="small"
                                    >
                                        Unstage File
                                    </Button>
                                </div>
                            ))}
                    </div>
                    <Button onClick={() => handlePull()} disabled={stagedFiles.length === 0} variant="contained">
                        Pull changes
                    </Button>
                </Stack>
            </Surface>
            <MergeEditor />
        </ResizablePanels>
    );
};
