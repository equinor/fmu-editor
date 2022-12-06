import {List, ListSubheader} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";

import React from "react";

import {Surface} from "@components/Surface";

import {useAppDispatch} from "@redux/hooks";
import {setCurrentCommit} from "@redux/reducers/ui";

import {ICommit, ISnapshotCommitBundle} from "@shared-types/changelog";

import "./commit-browser.css";
import {Commit} from "./components/commit";

export const CommitBrowser: React.FC = () => {
    const [commitBundles, setCommitBundles] = React.useState<ISnapshotCommitBundle[]>([]);

    const changelogWatcher = useChangelogWatcher();
    const dispatch = useAppDispatch();

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

    const handleCommitClick = (commit: ICommit, snapshotPath: string | null, compareSnapshotPath: string | null) => {
        dispatch(setCurrentCommit({...commit, snapshotPath, compareSnapshotPath}));
    };

    return (
        <Surface elevation="none" className="CommitBrowser">
            <div className="CommitBrowserContent">
                <List sx={{width: "100%"}} subheader={<li />}>
                    {commitBundles.map((bundle, index) => {
                        const lastBundle = commitBundles[index + 1];
                        return (
                            <li key={`section-${bundle.snapshotPath}`}>
                                <ul className="CommitSnapshotBundle">
                                    <ListSubheader className="CommitSnapshotBundleHeader">
                                        {bundle.modified.toDateString()}
                                    </ListSubheader>
                                    {bundle.commits.map(commit => (
                                        <React.Fragment key={commit.id}>
                                            <Commit
                                                id={commit.id}
                                                key={commit.id}
                                                message={commit.message}
                                                user={commit.author}
                                                onClick={() =>
                                                    handleCommitClick(
                                                        commit,
                                                        bundle.snapshotPath,
                                                        lastBundle?.snapshotPath ?? null
                                                    )
                                                }
                                            />
                                        </React.Fragment>
                                    ))}
                                </ul>
                            </li>
                        );
                    })}
                </List>
                {commitBundles.length === 0 && <div className="CommitBrowserContent__NoCommits">No Commits</div>}
            </div>
        </Surface>
    );
};
