import {useFileChanges} from "@hooks/useFileChanges";
import {LoadingButton} from "@mui/lab";
import {Button, IconButton, Stack} from "@mui/material";
import {useEnvironment} from "@services/environment-service";
import {
    FileOperationsServiceEventTypes,
    FileOperationsServiceEvents,
    PullState,
    useFileOperationsService,
} from "@services/file-operations-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscClose} from "react-icons/vsc";

import {File} from "@utils/file-system/file";
import {adjustToPlural} from "@utils/string";

import {ChangesList} from "@components/ChangesList";
import {ChangesListMode} from "@components/ChangesList/changes-list";
import {DiffEditor} from "@components/DiffEditor";
import {ResizablePanels} from "@components/ResizablePanels";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setDiffFiles, setView} from "@redux/reducers/ui";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

const FILE_ORIGINS = [FileChangeOrigin.MAIN, FileChangeOrigin.BOTH];

export const Pull: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);

    const fileChanges = useFileChanges(FILE_ORIGINS);
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();
    const {username} = useEnvironment();
    const {pullMainChanges, pullState} = useFileOperationsService();

    React.useEffect(() => {
        const handlePullStateChanged = (
            event: FileOperationsServiceEvents[FileOperationsServiceEventTypes.PULL_STATE_CHANGED]
        ) => {
            if (event.detail.state === PullState.PULLED) {
                setStagedFiles(event.detail.notPulledFiles || []);
                if (event.detail.notPulledFiles?.length === 0) {
                    notificationsService.publishNotification({
                        type: NotificationType.SUCCESS,
                        message: `Successfully pulled ${event.detail.pulledFiles?.length} ${adjustToPlural(
                            "file",
                            event.detail.pulledFiles?.length || 0
                        )}.`,
                    });
                    dispatch(setView(View.Main));
                    dispatch(resetDiffFiles());
                } else {
                    notificationsService.publishNotification({
                        type: NotificationType.WARNING,
                        message: `Successfully pulled ${event.detail.pulledFiles.length} ${adjustToPlural(
                            "file",
                            event.detail.pulledFiles?.length || 0
                        )}, failed to pull ${event.detail.notPulledFiles.length} ${adjustToPlural(
                            "file",
                            event.detail.notPulledFiles?.length || 0
                        )}.`,
                    });
                }
            }
            if (event.detail.state === PullState.FAILED) {
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: `Failed to pull ${event.detail.notPulledFiles} ${adjustToPlural(
                        "file",
                        event.detail.notPulledFiles?.length || 0
                    )}.`,
                });
            }
        };

        document.addEventListener(FileOperationsServiceEventTypes.PULL_STATE_CHANGED, handlePullStateChanged);

        return () => {
            document.removeEventListener(FileOperationsServiceEventTypes.PULL_STATE_CHANGED, handlePullStateChanged);
        };
    }, []);

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

    const handleStageAll = React.useCallback(() => {
        setStagedFiles(fileChanges.filter(el => el.origin !== FileChangeOrigin.BOTH).map(el => el.relativePath));
    }, [fileChanges]);

    const handleUnstageAll = React.useCallback(() => {
        setStagedFiles([]);
    }, []);

    const handlePull = React.useCallback(() => {
        pullMainChanges(fileChanges.filter(el => stagedFiles.includes(el.relativePath)));
    }, [fileChanges, stagedFiles, pullMainChanges]);

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

    const handleClose = React.useCallback(() => {
        dispatch(setView(View.Main));
        dispatch(resetDiffFiles());
    }, [dispatch]);

    const pullButtonStateMap = {
        [PullState.PULLING]: {
            text: "Pulling changes...",
            disabled: true,
            color: undefined,
        },
        [PullState.PULLED]: {
            text: "Changes successfully pulled",
            disabled: false,
            color: "success",
        },
        [PullState.FAILED]: {
            text: "Error pulling changes",
            disabled: false,
            color: "warning",
        },
        [PullState.IDLE]: {
            text: "Pull changes",
            disabled: false,
            color: undefined,
        },
    };

    return (
        <ResizablePanels direction="horizontal" id="pull" minSizes={[350, 0]}>
            <Surface elevation="raised" className="Explorer">
                <Surface elevation="raised">
                    <Stack direction="row" alignItems="center" justifyContent="space-between" className="ExplorerTitle">
                        Pull changes from main folder
                        <IconButton onClick={handleClose}>
                            <VscClose />
                        </IconButton>
                    </Stack>
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
                    <ChangesList
                        fileChanges={fileChanges.filter(el => !stagedFiles.includes(el.relativePath))}
                        mode={ChangesListMode.Staging}
                        onFileSelect={handleFileSelected}
                        onFileStage={handleStageOrUnstageFile}
                        onResolveConflicts={handleResolveConflicts}
                    />
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
                    <ChangesList
                        fileChanges={fileChanges.filter(el => stagedFiles.includes(el.relativePath))}
                        mode={ChangesListMode.Staging}
                        onFileSelect={handleFileSelected}
                        onFileStage={handleStageOrUnstageFile}
                    />
                    <LoadingButton
                        onClick={() => handlePull()}
                        variant="contained"
                        loading={pullState === PullState.PULLING}
                        disabled={stagedFiles.length === 0 || pullButtonStateMap[pullState].disabled}
                        color={pullButtonStateMap[pullState].color}
                    >
                        {pullButtonStateMap[pullState].text}
                    </LoadingButton>
                </Stack>
            </Surface>
            <DiffEditor />
        </ResizablePanels>
    );
};
