import {Divider, List, ListSubheader} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";

import React from "react";

import {Surface} from "@components/Surface";

import {useAppSelector} from "@redux/hooks";

import {ISnapshotCommitBundle} from "@shared-types/changelog";

import "./commit-browser.css";
import {Commit} from "./components/commit";

export const CommitBrowser: React.FC = () => {
    const [commitBundles, setCommitBundles] = React.useState<ISnapshotCommitBundle[]>([]);

    const changelogWatcher = useChangelogWatcher();
    const activeFile = useAppSelector(state => state.files.activeFile);

    React.useEffect(() => {
        changelogWatcher.getChangesForFile(activeFile);
    }, [activeFile, changelogWatcher]);

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
        <Surface elevation="raised" className="CommitBrowser">
            <Surface elevation="raised" className="CommitBrowserHeader">
                Commits
            </Surface>
            <div className="CommitBrowserContent">
                <List sx={{width: "100%"}} subheader={<li />}>
                    {commitBundles.map(bundle => (
                        <li key={`section-${bundle.snapshotPath}`}>
                            <ul className="CommitSnapshotBundle">
                                <ListSubheader style={{backgroundColor: "transparent"}}>
                                    {bundle.modified.toDateString()}
                                </ListSubheader>
                                {bundle.commits.map((commit, index) => (
                                    <React.Fragment key={commit.id}>
                                        {index > 0 && <Divider variant="inset" component="li" />}
                                        <Commit
                                            key={commit.id}
                                            message={commit.message}
                                            user={commit.author}
                                            timestamp={commit.datetime.getTime()}
                                        />
                                    </React.Fragment>
                                ))}
                            </ul>
                        </li>
                    ))}
                </List>
                {commitBundles.length === 0 && "No Commits"}
            </div>
        </Surface>
    );
};
