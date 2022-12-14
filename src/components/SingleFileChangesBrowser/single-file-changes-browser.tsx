import {Stack} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {CommitList} from "@components/CommitList";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveDiffFile} from "@redux/reducers/files";

import {ISnapshotCommitBundle} from "@shared-types/changelog";

import "./single-file-changes-browser.css";

export const SingleFileChangesBrowser: React.VFC = () => {
    const [fileChanges, setFileChanges] = React.useState<ISnapshotCommitBundle[]>([]);
    const activeFile = useAppSelector(state => state.files.activeFile);

    const changelogWatcher = useChangelogWatcher();
    const {fileManager} = useFileManager();
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
        dispatch(setActiveDiffFile({relativeFilePath: fileManager.relativeFilePath(activeFile)}));
    }, [activeFile, dispatch, fileManager]);

    return (
        <Surface elevation="raised" className="Explorer">
            <Surface elevation="raised">
                <Stack direction="row" alignItems="center" className="ExplorerTitle">
                    Commits to selected file
                </Stack>
            </Surface>
            <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                <div className="ChangesBrowserContentHeader">File</div>
                <div className="ChangesBrowserText">{fileManager.relativeFilePath(activeFile)}</div>
                <div className="ChangesBrowserContentHeader">Commits</div>
                <div>
                    <CommitList commitBundles={fileChanges} />
                </div>
            </Stack>
        </Surface>
    );
};
