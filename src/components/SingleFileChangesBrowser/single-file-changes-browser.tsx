import {IconButton, Stack} from "@mui/material";
import {changelogWatcherService} from "@services/changelog-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscClose} from "react-icons/vsc";

import {CommitList} from "@components/CommitList";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setDiffUserFile, setView} from "@redux/reducers/ui";

import {ISnapshotCommitBundle} from "@shared-types/changelog";
import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

import path from "path";

import "./single-file-changes-browser.css";

export const SingleFileChangesBrowser: React.VFC = () => {
    const [fileChanges, setFileChanges] = React.useState<ISnapshotCommitBundle[]>([]);
    const activeFile = useAppSelector(state => state.files.activeFilePath);

    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        changelogWatcherService
            .getChangesForFile(activeFile)
            .then(result => {
                setFileChanges(result);
            })
            .catch(error => {
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: error,
                });
            });
    }, [activeFile]);

    React.useEffect(() => {
        dispatch(
            setDiffUserFile({userFile: path.relative(workingDirectoryPath, activeFile), origin: FileChangeOrigin.USER})
        );
    }, [activeFile, dispatch, workingDirectoryPath]);

    const handleClose = React.useCallback(() => {
        dispatch(resetDiffFiles());
        dispatch(setView(View.Main));
    }, [dispatch]);

    return (
        <Surface elevation="raised" className="Explorer">
            <Surface elevation="raised">
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="ExplorerTitle">
                    Commits to selected file
                    <IconButton onClick={handleClose}>
                        <VscClose />
                    </IconButton>
                </Stack>
            </Surface>
            <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                <div className="ChangesBrowserContentHeader">File</div>
                <div className="ChangesBrowserText">{path.relative(workingDirectoryPath, activeFile)}</div>
                <div className="ChangesBrowserContentHeader">Commits</div>
                <div>
                    <CommitList commitBundles={fileChanges} />
                </div>
            </Stack>
        </Surface>
    );
};
