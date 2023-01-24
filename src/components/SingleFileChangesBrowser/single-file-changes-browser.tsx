import {IconButton, Stack} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";

import React from "react";
import {VscClose} from "react-icons/vsc";

import {CommitList} from "@components/CommitList";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setDiffUserFile, setView} from "@redux/reducers/ui";

import {ISnapshotCommitBundle} from "@shared-types/changelog";
import {FileChangeOrigin} from "@shared-types/file-changes";
import {View} from "@shared-types/ui";

import path from "path";

import "./single-file-changes-browser.css";

export const SingleFileChangesBrowser: React.VFC = () => {
    const [fileChanges, setFileChanges] = React.useState<ISnapshotCommitBundle[]>([]);
    const activeFile = useAppSelector(state => state.files.activeFile);

    const changelogWatcher = useChangelogWatcher();
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (activeFile) {
            changelogWatcher.getChangesForFile(activeFile);
        }
    }, [activeFile, changelogWatcher]);

    React.useEffect(() => {
        setFileChanges(changelogWatcher.changesForFile);
    }, [changelogWatcher.changesForFile]);

    React.useEffect(() => {
        dispatch(setDiffUserFile({userFile: path.relative(directory, activeFile), origin: FileChangeOrigin.USER}));
    }, [activeFile, dispatch, directory]);

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
                <div className="ChangesBrowserText">{path.relative(directory, activeFile)}</div>
                <div className="ChangesBrowserContentHeader">Commits</div>
                <div>
                    <CommitList commitBundles={fileChanges} />
                </div>
            </Stack>
        </Surface>
    );
};
