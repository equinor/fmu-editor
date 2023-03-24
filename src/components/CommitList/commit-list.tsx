import {List, ListSubheader} from "@mui/material";

import React from "react";

import {OverflowEllipsis} from "@components/OverflowEllipsis";
import {EllipsisPosition} from "@components/OverflowEllipsis/overflow-ellipsis";

import {useAppSelector} from "@redux/hooks";

import {ICommit, ISnapshotCommitBundle} from "@shared-types/changelog";

import path from "path";

import "./commit-list.css";
import {Commit} from "./components/commit";

export type CommitListProps = {
    commitBundles: ISnapshotCommitBundle[];
    onCommitClick?: (
        commit: ICommit,
        snapshotPath: string | null,
        compareSnapshotPath: string | null | undefined
    ) => void;
};

export const CommitList: React.FC<CommitListProps> = props => {
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    const handleCommitClick = (
        commit: ICommit,
        snapshotPath: string | null,
        compareSnapshotPath: string | null | undefined
    ) => {
        if (!props.onCommitClick) {
            return;
        }
        props.onCommitClick(commit, snapshotPath, compareSnapshotPath);
    };

    if (props.commitBundles.length === 0) {
        return <div className="CommitList__NoCommits">No Commits</div>;
    }

    return (
        <List sx={{width: "100%"}} subheader={<li />}>
            {props.commitBundles
                .filter(bundle => bundle.commits.length > 0)
                .map((bundle, index) => {
                    const lastBundle = props.commitBundles[index + 1];
                    return (
                        <li key={`section-${bundle.snapshotPath}`}>
                            <ul className="CommitSnapshotBundle">
                                <ListSubheader className="CommitSnapshotBundleHeader">
                                    <h3>{new Date(bundle.modified).toDateString()}</h3>{" "}
                                    <span>
                                        <OverflowEllipsis
                                            text={
                                                bundle.snapshotPath !== null
                                                    ? path.relative(workingDirectoryPath, bundle.snapshotPath)
                                                    : "current working directory"
                                            }
                                            ellipsisPosition={EllipsisPosition.LEFT}
                                            showFullTextAsTitle
                                        />
                                    </span>
                                </ListSubheader>
                                {bundle.commits.map(commit => (
                                    <React.Fragment key={commit.id}>
                                        <Commit
                                            id={commit.id}
                                            key={commit.id}
                                            message={commit.message}
                                            user={commit.author}
                                            datetime={commit.datetime}
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
