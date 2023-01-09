import {Typography} from "@mui/material";
import {Stack} from "@mui/system";
import {useChangelogWatcher} from "@services/changelog-service";

import React from "react";
import {VscSourceControl} from "react-icons/vsc";

import {CommitList} from "@components/CommitList";
import {Surface} from "@components/Surface";

import {ISnapshotCommitBundle} from "@shared-types/changelog";

import "./commit-browser.css";

export const CommitBrowser: React.FC = () => {
    const [commitBundles, setCommitBundles] = React.useState<ISnapshotCommitBundle[]>([]);

    const changelogWatcher = useChangelogWatcher();

    React.useEffect(() => {
        changelogWatcher.getAllChanges();
        const handleChangelogModified = () => {
            changelogWatcher.getAllChanges();
        };
        document.addEventListener("changelog-modified", handleChangelogModified);

        return () => {
            document.removeEventListener("changelog-modified", handleChangelogModified);
        };
    }, [changelogWatcher]);

    React.useEffect(() => {
        setCommitBundles(changelogWatcher.allChanges);
    }, [changelogWatcher.allChanges]);

    return (
        <Surface elevation="none" className="CommitBrowser">
            <div className="CommitBrowserContent">
                {commitBundles.length === 0 || commitBundles.at(0)?.commits.length === 0 ? (
                    <Stack direction="column" className="CommitBrowserEmpty" spacing={2}>
                        <VscSourceControl size={40} />
                        <Typography variant="body2">No commits in the current working directory yet</Typography>
                    </Stack>
                ) : (
                    <CommitList commitBundles={commitBundles} />
                )}
            </div>
        </Surface>
    );
};
