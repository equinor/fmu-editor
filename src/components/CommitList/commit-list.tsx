import {List, ListSubheader} from "@mui/material";

import React from "react";

import {useAppDispatch} from "@redux/hooks";
import {setCurrentCommit} from "@redux/reducers/ui";

import {ICommit, ISnapshotCommitBundle} from "@shared-types/changelog";

import "./commit-list.css";
import {Commit} from "./components/commit";

export type CommitListProps = {
    commitBundles: ISnapshotCommitBundle[];
};

export const CommitList: React.FC<CommitListProps> = props => {
    const dispatch = useAppDispatch();

    const handleCommitClick = (
        commit: ICommit,
        snapshotPath: string | null,
        compareSnapshotPath: string | null | undefined
    ) => {
        dispatch(setCurrentCommit({...commit, snapshotPath, compareSnapshotPath}));
    };

    if (props.commitBundles.length === 0) {
        return <div className="CommitList__NoCommits">No Commits</div>;
    }

    return (
        <List sx={{width: "100%"}} subheader={<li />}>
            {props.commitBundles.map((bundle, index) => {
                const lastBundle = props.commitBundles[index + 1];
                return (
                    <li key={`section-${bundle.snapshotPath}`}>
                        <ul className="CommitSnapshotBundle">
                            <ListSubheader className="CommitSnapshotBundleHeader">
                                {new Date(bundle.modified).toDateString()}
                            </ListSubheader>
                            {bundle.commits.map(commit => (
                                <React.Fragment key={commit.id}>
                                    <Commit
                                        id={commit.id}
                                        key={commit.id}
                                        message={commit.message}
                                        user={commit.author}
                                        onClick={() =>
                                            handleCommitClick(commit, bundle.snapshotPath, lastBundle?.snapshotPath)
                                        }
                                    />
                                </React.Fragment>
                            ))}
                        </ul>
                    </li>
                );
            })}
        </List>
    );
};
