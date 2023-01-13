import {useFileChanges} from "@hooks/useFileChanges";
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

import {ChangesList, ChangesListMode} from "../../ChangesList/changes-list";

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
    const directory = useAppSelector(state => state.files.directory);

    React.useEffect(() => {
        setStagedFiles(prev => prev.filter(el => userFileChanges.some(change => change.relativePath === el)));
    }, [userFileChanges]);

    const handleStageOrUnstageFile = React.useCallback(
        (filePath: string) => {
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

    const handleResolveConflicts = React.useCallback(
        (relativeFilePath: string) => {
            const file = new File(relativeFilePath, directory);
            dispatch(
                setDiffFiles({
                    mainFile: file.getMainVersion().relativePath(),
                    userFile: file.getUserVersion(username).relativePath(),
                    origin: FileChangeOrigin.BOTH,
                })
            );
        },
        [dispatch, directory, username]
    );

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
                    <ChangesList
                        mode={ChangesListMode.Staging}
                        fileChanges={userFileChanges.filter(el => !stagedFiles.includes(el.relativePath))}
                        onFileSelect={handleFileSelected}
                        onFileStage={handleStageOrUnstageFile}
                        onResolveConflicts={handleResolveConflicts}
                    />
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
                    <ChangesList
                        mode={ChangesListMode.Staging}
                        fileChanges={userFileChanges.filter(el => stagedFiles.includes(el.relativePath))}
                        onFileSelect={handleFileSelected}
                        onFileUnstage={handleStageOrUnstageFile}
                    />
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
