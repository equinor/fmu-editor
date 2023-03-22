import {useFileChanges} from "@hooks/useFileChanges";
import {useTimedState} from "@hooks/useTimedState";
import {LoadingButton} from "@mui/lab";
import {Button, CircularProgress, IconButton, Stack} from "@mui/material";
import {useEnvironmentService} from "@services/environment-service";
import {PushState, fileOperationsService} from "@services/file-operations-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscClose} from "react-icons/vsc";

import {File} from "@utils/file-system/file";

import {ChangesList, ChangesListMode} from "@components/ChangesList/changes-list";
import {Input} from "@components/Input";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setChangesBrowserView, setDiffFiles} from "@redux/reducers/ui";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {ChangesBrowserView} from "@shared-types/ui";

const FILE_ORIGINS = [FileChangeOrigin.USER, FileChangeOrigin.BOTH];

export const CurrentChanges: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);
    const [commitSummary, setCommitSummary] = React.useState<string>("");
    const [commitDescription, setCommitDescription] = React.useState<string>("");
    const [pushState, setPushState] = useTimedState<PushState>(PushState.IDLE, 3000);

    const {fileChanges: userFileChanges, initialized} = useFileChanges(FILE_ORIGINS);

    const dispatch = useAppDispatch();
    const {username} = useEnvironmentService();
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

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

    const handlePush = React.useCallback(() => {
        if (stagedFiles.length === 0) return;

        fileOperationsService
            .pushUserChanges(
                userFileChanges.filter(el => stagedFiles.includes(el.relativePath)),
                commitSummary,
                commitDescription
            )
            .then(result => {
                setPushState(result.commitMessageWritten ? PushState.PUSHED : PushState.FAILED);
                if (result.commitMessageWritten) {
                    if (stagedFiles.length === userFileChanges.length) {
                        dispatch(setChangesBrowserView(ChangesBrowserView.LoggedChanges));
                    }
                    if (result.notPushedFilesPaths.length === 0) {
                        notificationsService.publishNotification({
                            type: NotificationType.SUCCESS,
                            message: "All changes successfully committed",
                        });
                        setCommitDescription("");
                        setCommitSummary("");
                        return;
                    }
                    notificationsService.publishNotification({
                        type: NotificationType.ERROR,
                        message: "Some changes could not be committed",
                    });
                } else {
                    notificationsService.publishNotification({
                        type: NotificationType.ERROR,
                        message: "An error occurred while committing changes",
                    });
                }
            })
            .catch(() => {
                setPushState(PushState.FAILED);
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: "An error occurred while committing changes",
                });
            });

        setPushState(PushState.PUSHING, false);

        dispatch(
            setDiffFiles({
                originalRelativeFilePath: undefined,
                modifiedRelativeFilePath: undefined,
                origin: undefined,
            })
        );
    }, [commitDescription, commitSummary, dispatch, stagedFiles, userFileChanges, setPushState]);

    const handleFileSelected = React.useCallback(
        (filePath: string, origin: FileChangeOrigin) => {
            const file = new File(filePath, workingDirectoryPath);
            dispatch(
                setDiffFiles({
                    originalRelativeFilePath: file.getMainVersion().relativePath(),
                    modifiedRelativeFilePath: file.getUserVersion(username).relativePath(),
                    origin,
                })
            );
        },
        [dispatch, username, workingDirectoryPath]
    );

    const handleStageAll = React.useCallback(() => {
        setStagedFiles(userFileChanges.filter(el => el.origin !== FileChangeOrigin.BOTH).map(el => el.relativePath));
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
            const file = new File(relativeFilePath, workingDirectoryPath);
            dispatch(
                setDiffFiles({
                    originalRelativeFilePath: file.getMainVersion().relativePath(),
                    modifiedRelativeFilePath: file.getUserVersion(username).relativePath(),
                    origin: FileChangeOrigin.BOTH,
                })
            );
        },
        [dispatch, workingDirectoryPath, username]
    );

    if (!initialized) {
        return (
            <Stack
                direction="column"
                className="ChangesBrowserContent"
                style={{
                    display: "flex",
                    height: "100%",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                spacing={2}
            >
                <CircularProgress />
            </Stack>
        );
    }

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
                        mode={ChangesListMode.Unstaging}
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
                        disabled={pushState === PushState.PUSHING}
                    />
                    <Input
                        placeholder="Description"
                        multiline
                        rows={5}
                        onChange={e => setCommitDescription(e.target.value)}
                        value={commitDescription}
                        fontSize="0.98rem"
                        disabled={pushState === PushState.PUSHING}
                    />
                </Stack>
                <LoadingButton
                    onClick={() => handlePush()}
                    disabled={stagedFiles.length === 0 || commitSummary.length === 0}
                    variant="contained"
                    loading={pushState === PushState.PUSHING}
                >
                    {pushState === PushState.PUSHING ? "Pushing changes" : "Push changes"}
                </LoadingButton>
            </Stack>
        </>
    );
};
