import {List, Paper, Typography} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";

import React from "react";

import {useAppSelector} from "@redux/hooks";

import {ISnapshotCommitBundle} from "@shared-types/changelog";

import "./commit-browser.css";
import {Commit} from "./components/commit";

export const CommitBrowser: React.FC = () => {
    const [commitBundles, setCommitBundles] = React.useState<ISnapshotCommitBundle[]>([]);

    const changelogWatcher = useChangelogWatcher();
    const activeFile = useAppSelector(state => state.files.activeFile);

    React.useEffect(() => {
        const handleChangelogModified = () => {
            changelogWatcher.getChangesForFile(activeFile);
        };
        document.addEventListener("changelog-modified", handleChangelogModified);

        return () => {
            document.removeEventListener("changelog-modified", handleChangelogModified);
        };
    }, [activeFile, changelogWatcher]);

    React.useEffect(() => {
        setCommitBundles(changelogWatcher.changesForFile);
    }, [changelogWatcher.changesForFile]);

    return (
        <Paper elevation={4} className="CommitBrowser">
            <Typography variant="h5">Commits</Typography>
            {commitBundles.map(bundle => (
                <>
                    <Typography variant="h6">{bundle.modified.toDateString()}</Typography>
                    <List sx={{width: "100%", maxWidth: 360}}>
                        {bundle.commits.map(commit => (
                            <Commit
                                key={commit.id}
                                summary="Commit"
                                message={commit.message}
                                user={commit.author}
                                timestamp={commit.datetime.getTime()}
                            />
                        ))}
                    </List>
                </>
            ))}
            {commitBundles.length === 0 && (
                <Typography variant="body2" sx={{textAlign: "center"}}>
                    No commits
                </Typography>
            )}
        </Paper>
    );
};
