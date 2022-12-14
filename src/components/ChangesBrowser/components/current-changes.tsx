import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Add, Edit, Remove} from "@mui/icons-material";
import {Button, Stack} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";
import {useEnvironment} from "@services/environment-service";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {Input} from "@components/Input";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveDiffFile} from "@redux/reducers/files";

import {ICommit} from "@shared-types/changelog";
import {FileChangeType} from "@shared-types/file-changes";

import {v4} from "uuid";

export const CurrentChanges: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);
    const [commitSummary, setCommitSummary] = React.useState<string>("");
    const [commitDescription, setCommitDescription] = React.useState<string>("");

    const userFileChanges = useUserFileChanges();
    const activeDiffFile = useAppSelector(state => state.files.activeDiffFile);
    const dispatch = useAppDispatch();
    const environment = useEnvironment();
    const fileManager = useFileManager();
    const changelog = useChangelogWatcher();

    React.useEffect(() => {
        setStagedFiles(prev => prev.filter(el => userFileChanges.some(change => change.filePath === el)));
    }, [userFileChanges, environment]);

    const handleCommitChange = React.useCallback(
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

    const handleCommit = React.useCallback(() => {
        if (fileManager.fileManager.commitFileChanges(stagedFiles) && environment.username) {
            const commit: ICommit = {
                id: v4(),
                author: environment.username,
                message: [commitSummary, commitDescription].join("\n"),
                datetime: new Date().getTime(),
                files: stagedFiles.map(el => ({
                    path: el,
                    action: userFileChanges.find(change => change.filePath === el)?.type || FileChangeType.MODIFIED,
                })),
            };
            changelog.appendCommit(commit);
            setCommitSummary("");
            setCommitDescription("");
            setStagedFiles([]);
            dispatch(setActiveDiffFile({relativeFilePath: null}));
        }
    }, [stagedFiles, fileManager, environment, changelog, commitSummary, commitDescription, userFileChanges, dispatch]);

    const handleFileSelected = React.useCallback(
        (file: string) => {
            dispatch(
                setActiveDiffFile({
                    relativeFilePath: file,
                })
            );
        },
        [dispatch]
    );

    const handleStageAll = React.useCallback(() => {
        setStagedFiles(userFileChanges.map(el => el.filePath));
    }, [userFileChanges]);

    const handleUnstageAll = React.useCallback(() => {
        setStagedFiles([]);
    }, []);

    return (
        <>
            {userFileChanges.length > 0 && (
                <Surface elevation="raised" className="ChangesBrowserHeader">
                    {userFileChanges.length} file change{userFileChanges.length > 1 && "s"} to commit
                </Surface>
            )}
            <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                <div className="ChangesBrowserContentHeader">
                    Unstaged Files ({userFileChanges.filter(el => !stagedFiles.includes(el.filePath)).length})
                    <Button
                        variant="contained"
                        onClick={() => handleStageAll()}
                        disabled={stagedFiles.length === userFileChanges.length}
                        color="success"
                        size="small"
                    >
                        Stage all
                    </Button>
                </div>
                <div className="ChangesBrowserList">
                    {userFileChanges
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
                                    <span title={fileChange.filePath}>{fileChange.filePath}</span>
                                </div>
                                <Button
                                    variant="text"
                                    onClick={e => handleCommitChange(e, fileChange.filePath)}
                                    size="small"
                                >
                                    Stage File
                                </Button>
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
                    {userFileChanges
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
                                    onClick={e => handleCommitChange(e, fileChange.filePath)}
                                    size="small"
                                >
                                    Unstage File
                                </Button>
                            </div>
                        ))}
                </div>
                <div className="ChangesBrowserContentHeader">Commit Message</div>
                <Stack direction="column" spacing={0}>
                    <Input
                        placeholder="Summary"
                        onChange={e => setCommitSummary(e.target.value)}
                        value={commitSummary}
                        maxLength={70}
                    />
                    <Input
                        placeholder="Description"
                        multiline
                        rows={5}
                        onChange={e => setCommitDescription(e.target.value)}
                        value={commitDescription}
                        fontSize="0.98rem"
                    />
                </Stack>
                <Button
                    onClick={() => handleCommit()}
                    disabled={stagedFiles.length === 0 || commitSummary.length === 0}
                    variant="contained"
                >
                    Commit changes
                </Button>
            </Stack>
        </>
    );
};
