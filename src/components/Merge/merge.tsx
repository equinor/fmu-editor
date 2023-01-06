import {useFileChanges} from "@hooks/useFileChanges";
import {Add, Edit, Remove} from "@mui/icons-material";
import {Button, Stack, Typography} from "@mui/material";
import {useEnvironment} from "@services/environment-service";

import React from "react";

import {File} from "@utils/file-system/file";

import {DiffEditor} from "@components/DiffEditor";
import {ResizablePanels} from "@components/ResizablePanels";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDiffFiles} from "@redux/reducers/ui";

import {FileChangeOrigin, FileChangeType} from "@shared-types/file-changes";

const FILE_ORIGINS = [FileChangeOrigin.MAIN, FileChangeOrigin.BOTH];

export const Merge: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);

    const diffMainFile = useAppSelector(state => state.ui.diffMainFile);
    const fileChanges = useFileChanges(FILE_ORIGINS);
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();
    const {username} = useEnvironment();

    const handleFileSelected = React.useCallback(
        (filePath: string, origin: FileChangeOrigin) => {
            const file = new File(filePath, directory);
            dispatch(
                setDiffFiles({
                    mainFile: file.getMainVersion().relativePath(),
                    userFile: file.getUserVersion(username).relativePath(),
                    origin,
                })
            );
        },
        [dispatch, directory, username]
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
        setStagedFiles(fileChanges.filter(el => el.origin !== FileChangeOrigin.BOTH).map(el => el.relativePath));
    }, [fileChanges]);

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
                        Unstaged Files ({fileChanges.filter(el => !stagedFiles.includes(el.relativePath)).length})
                        <Button
                            variant="contained"
                            onClick={() => handleStageAll()}
                            disabled={stagedFiles.length === fileChanges.length}
                            color="success"
                            size="small"
                        >
                            Stage all
                        </Button>
                    </div>
                    <div className="ChangesBrowserList">
                        {fileChanges
                            .filter(el => !stagedFiles.includes(el.relativePath))
                            .map(fileChange => (
                                <div
                                    className={`ChangesBrowserListItem${
                                        fileChange.relativePath === diffMainFile
                                            ? " ChangesBrowserListItemSelected"
                                            : ""
                                    }`}
                                    key={fileChange.relativePath}
                                    onClick={() => handleFileSelected(fileChange.relativePath, fileChange.origin)}
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
                                        <span title={fileChange.relativePath}>{fileChange.relativePath}&lrm;</span>
                                    </div>
                                    {fileChange.origin === FileChangeOrigin.BOTH ? (
                                        <Typography color="error">Merging required</Typography>
                                    ) : (
                                        <Button
                                            variant="text"
                                            onClick={e => handleStageFile(e, fileChange.relativePath)}
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
                        {fileChanges
                            .filter(el => stagedFiles.includes(el.relativePath))
                            .map(fileChange => (
                                <div
                                    className={`ChangesBrowserListItem${
                                        fileChange.relativePath === diffMainFile
                                            ? " ChangesBrowserListItemSelected"
                                            : ""
                                    }`}
                                    key={fileChange.relativePath}
                                    onClick={() => handleFileSelected(fileChange.relativePath, fileChange.origin)}
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
                                        <span title={fileChange.relativePath}>{fileChange.relativePath}</span>
                                    </div>
                                    <Button
                                        variant="text"
                                        onClick={e => handleStageFile(e, fileChange.relativePath)}
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
            <DiffEditor />
        </ResizablePanels>
    );
};
