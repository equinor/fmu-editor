import {useFileChanges} from "@hooks/useFileChanges";
import {useTimedState} from "@hooks/useTimedState";
import {LoadingButton} from "@mui/lab";
import {Button, IconButton, Stack} from "@mui/material";
import {useEnvironmentService} from "@services/environment-service";
import {PullState} from "@services/file-operations-service";
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

import {fileOperationsService} from "../../services/file-operations-service";

const FILE_ORIGINS = [FileChangeOrigin.MAIN, FileChangeOrigin.BOTH];

export const Pull: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);
    const [pullState, setPullState] = useTimedState<PullState>(PullState.IDLE, 3000);

    const {fileChanges} = useFileChanges(FILE_ORIGINS);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const dispatch = useAppDispatch();
    const {username} = useEnvironmentService();

    const handleFileSelected = React.useCallback(
        (filePath: string, origin: FileChangeOrigin) => {
            const file = new File(filePath, workingDirectoryPath);
            dispatch(
                setDiffFiles({
                    mainFile: file.getMainVersion().relativePath(),
                    userFile: file.getUserVersion(username).relativePath(),
                    origin,
                })
            );
        },
        [dispatch, workingDirectoryPath, username]
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
        setPullState(PullState.PULLING);
        fileOperationsService
            .pullMainChanges(fileChanges.filter(el => stagedFiles.includes(el.relativePath)))
            .then(result => {
                if (result.success) {
                    setPullState(PullState.PULLED);
                    setStagedFiles(result.notPulledFilesPaths || []);
                    if (result.notPulledFilesPaths?.length === 0) {
                        notificationsService.publishNotification({
                            type: NotificationType.SUCCESS,
                            message: `Successfully pulled ${result.pulledFilesPaths?.length} ${adjustToPlural(
                                "file",
                                result.pulledFilesPaths?.length || 0
                            )}.`,
                        });
                        dispatch(setView(View.SourceControl));
                        dispatch(resetDiffFiles());
                    } else {
                        notificationsService.publishNotification({
                            type: NotificationType.WARNING,
                            message: `Successfully pulled ${result.pulledFilesPaths.length} ${adjustToPlural(
                                "file",
                                result.pulledFilesPaths?.length || 0
                            )}, failed to pull ${result.notPulledFilesPaths.length} ${adjustToPlural(
                                "file",
                                result.notPulledFilesPaths?.length || 0
                            )}.`,
                        });
                    }
                } else {
                    setPullState(PullState.FAILED);
                    notificationsService.publishNotification({
                        type: NotificationType.ERROR,
                        message: `Failed to pull ${result.notPulledFilesPaths} ${adjustToPlural(
                            "file",
                            result.notPulledFilesPaths?.length || 0
                        )}.`,
                    });
                }
            })
            .catch(() => {
                setPullState(PullState.FAILED);
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: `Failed to pull ${stagedFiles.length} ${adjustToPlural(
                        "file",
                        stagedFiles?.length || 0
                    )}.`,
                });
            });
    }, [dispatch, fileChanges, stagedFiles, setPullState]);

    const handleResolveConflicts = React.useCallback(
        (relativeFilePath: string) => {
            const file = new File(relativeFilePath, workingDirectoryPath);
            dispatch(
                setDiffFiles({
                    mainFile: file.getMainVersion().relativePath(),
                    userFile: file.getUserVersion(username).relativePath(),
                    origin: FileChangeOrigin.BOTH,
                })
            );
        },
        [dispatch, workingDirectoryPath, username]
    );

    const handleClose = React.useCallback(() => {
        dispatch(setView(View.SourceControl));
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
