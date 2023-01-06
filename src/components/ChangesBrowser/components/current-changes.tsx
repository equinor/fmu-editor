import {useFileChanges} from "@hooks/useFileChanges";
import {Add, Edit, Remove} from "@mui/icons-material";
import {Button, IconButton, Stack} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";
import {useEnvironment} from "@services/environment-service";
import {useFileManager} from "@services/file-manager";

import React from "react";
import {VscClose} from "react-icons/vsc";

import {File} from "@utils/file-system/file";

import {Input} from "@components/Input";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setChangesBrowserView, setDiffFiles} from "@redux/reducers/ui";

import {ICommit} from "@shared-types/changelog";
import {FileChangeOrigin, FileChangeType} from "@shared-types/file-changes";
import {ChangesBrowserView} from "@shared-types/ui";

import path from "path";
import {v4} from "uuid";

const FILE_ORIGINS = [FileChangeOrigin.USER, FileChangeOrigin.BOTH];

export const CurrentChanges: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);
    const [commitSummary, setCommitSummary] = React.useState<string>("");
    const [commitDescription, setCommitDescription] = React.useState<string>("");

    const userFileChanges = useFileChanges(FILE_ORIGINS);

    const dispatch = useAppDispatch();
    const {username} = useEnvironment();
    const {fileManager} = useFileManager();
    const changelog = useChangelogWatcher();
    const diffMainFile = useAppSelector(state => state.ui.diffMainFile);
    const directory = useAppSelector(state => state.files.directory);

    React.useEffect(() => {
        setStagedFiles(prev => prev.filter(el => userFileChanges.some(change => change.relativePath === el)));
    }, [userFileChanges]);

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
        if (
            fileManager.commitFileChanges(
                stagedFiles.map(file =>
                    fileManager.getUserFileIfExists(path.join(fileManager.getCurrentDirectory(), file))
                )
            ) &&
            username
        ) {
            const commit: ICommit = {
                id: v4(),
                author: username,
                message: [commitSummary, commitDescription].join("\n"),
                datetime: new Date().getTime(),
                files: stagedFiles.map(el => ({
                    path: el,
                    action: userFileChanges.find(change => change.relativePath === el)?.type || FileChangeType.MODIFIED,
                })),
            };
            changelog.appendCommit(commit);
            setCommitSummary("");
            setCommitDescription("");
            setStagedFiles([]);
            dispatch(
                setDiffFiles({
                    mainFile: undefined,
                    userFile: undefined,
                    origin: undefined,
                })
            );
        }
    }, [stagedFiles, fileManager, username, changelog, commitSummary, commitDescription, userFileChanges, dispatch]);

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
        [dispatch, username, directory]
    );

    const handleStageAll = React.useCallback(() => {
        setStagedFiles(userFileChanges.map(el => el.relativePath));
    }, [userFileChanges]);

    const handleUnstageAll = React.useCallback(() => {
        setStagedFiles([]);
    }, []);

    const handleClose = React.useCallback(() => {
        dispatch(resetDiffFiles());
        dispatch(setChangesBrowserView(ChangesBrowserView.LoggedChanges));
    }, [dispatch]);

    return (
        <>
            <Surface elevation="raised" className="ChangesBrowserHeader">
                <div>
                    {userFileChanges.length} file change{userFileChanges.length > 1 && "s"} to commit
                </div>
                <IconButton onClick={handleClose}>
                    <VscClose />
                </IconButton>
            </Surface>
            <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                <div className="ChangesBrowserContentHeader">
                    Unstaged Files ({userFileChanges.filter(el => !stagedFiles.includes(el.relativePath)).length})
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
                        .filter(el => !stagedFiles.includes(el.relativePath))
                        .map(fileChange => (
                            <div
                                className={`ChangesBrowserListItem${
                                    fileChange.relativePath === diffMainFile ? " ChangesBrowserListItemSelected" : ""
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
                                {fileChange.origin === FileChangeOrigin.USER ? (
                                    <Button
                                        variant="text"
                                        onClick={e => handleCommitChange(e, fileChange.relativePath)}
                                        size="small"
                                    >
                                        Stage File
                                    </Button>
                                ) : (
                                    <Button
                                        variant="text"
                                        onClick={e => handleCommitChange(e, fileChange.relativePath)}
                                        size="small"
                                        color="error"
                                    >
                                        Merging required
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
                    {userFileChanges
                        .filter(el => stagedFiles.includes(el.relativePath))
                        .map(fileChange => (
                            <div
                                className={`ChangesBrowserListItem${
                                    fileChange.relativePath === diffMainFile ? " ChangesBrowserListItemSelected" : ""
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
                                <Button
                                    variant="text"
                                    onClick={e => handleCommitChange(e, fileChange.relativePath)}
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
