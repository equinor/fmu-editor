import {IconButton, Stack} from "@mui/material";
import {changelogWatcherService} from "@services/changelog-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscClose} from "react-icons/vsc";

import {File} from "@utils/file-system/file";

import {CommitList} from "@components/CommitList";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setCurrentCommit, setDiffFiles, setDiffModifiedFilePath, setView} from "@redux/reducers/ui";

import {ICommit, ISnapshotCommitBundle} from "@shared-types/changelog";
import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

import path from "path";

import "./single-file-changes-browser.css";

export const SingleFileChangesBrowser: React.VFC = () => {
    const [fileChanges, setFileChanges] = React.useState<ISnapshotCommitBundle[]>([]);

    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const activeFile = React.useRef<File>(
        new File(path.relative(workingDirectoryPath, activeFilePath), workingDirectoryPath)
    );

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        activeFile.current = new File(path.relative(workingDirectoryPath, activeFilePath), workingDirectoryPath);
        changelogWatcherService
            .getChangesForFile(activeFile.current.getMainVersion().relativePath())
            .then(result => {
                setFileChanges(result);
            })
            .catch(error => {
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: error,
                });
            });
    }, [activeFilePath, workingDirectoryPath]);

    React.useEffect(() => {
        dispatch(
            setDiffModifiedFilePath({
                modifiedRelativeFilePath: activeFile.current.getMainVersion().relativePath(),
            })
        );
    }, [activeFilePath, dispatch, workingDirectoryPath]);

    const handleCommitClick = React.useCallback(
        (commit: ICommit, snapshotPath: string | null, compareSnapshotPath: string | null | undefined) => {
            const mainFile = compareSnapshotPath
                ? path.relative(
                      workingDirectoryPath,
                      path.join(compareSnapshotPath, activeFile.current.getMainVersion().relativePath())
                  )
                : path.relative(
                      workingDirectoryPath,
                      path.join(workingDirectoryPath, activeFile.current.getMainVersion().relativePath())
                  );
            dispatch(
                setDiffFiles({
                    originalRelativeFilePath: mainFile,
                    modifiedRelativeFilePath: snapshotPath
                        ? path.relative(
                              workingDirectoryPath,
                              path.join(snapshotPath, activeFile.current.getMainVersion().relativePath())
                          )
                        : activeFile.current.getMainVersion().relativePath(),
                    origin: FileChangeOrigin.USER,
                })
            );
            dispatch(setCurrentCommit({...commit, snapshotPath, compareSnapshotPath}));
        },
        [dispatch, workingDirectoryPath]
    );

    const handleClose = React.useCallback(() => {
        dispatch(resetDiffFiles());
        dispatch(setView(View.Editor));
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
                <div className="ChangesBrowserText">{activeFile.current.getMainVersion().relativePath()}</div>
                <div className="ChangesBrowserContentHeader">Commits</div>
                <div>
                    <CommitList commitBundles={fileChanges} onCommitClick={handleCommitClick} />
                </div>
            </Stack>
        </Surface>
    );
};
