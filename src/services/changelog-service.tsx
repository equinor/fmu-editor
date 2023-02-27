import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {NotificationType} from "@components/Notifications";

import {Webworker} from "@workers/worker-utils";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {
    ChangelogWatcherRequestTypes,
    ChangelogWatcherRequests,
    ChangelogWatcherResponseTypes,
    ChangelogWatcherResponses,
    ICommit,
    ISnapshotCommitBundle,
} from "@shared-types/changelog";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import worker from "worker-loader!@workers/changelog-watcher.worker";

const changelogWatcherWorker = new Webworker<ChangelogWatcherRequests, ChangelogWatcherResponses>({Worker: worker});

export type Context = {
    appendCommit: (commit: ICommit) => void;
    getChangesForFile: (filePath: string) => void;
    getAllChanges: () => void;
    changesForFile: ISnapshotCommitBundle[];
    allChanges: ISnapshotCommitBundle[];
};

export class ChangelogWatcherServiceClass {
    private changelogWatcherWorker: Webworker<ChangelogWatcherRequests, ChangelogWatcherResponses>;
    private subscribers: (() => void)[] = [];
    constructor() {
        this.changelogWatcherWorker = new Webworker<ChangelogWatcherRequests, ChangelogWatcherResponses>({
            Worker: worker,
        });

        this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.COMMIT_APPENDED, () => {
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Commit appended",
                })
            );
        });
        this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.MODIFIED, () => {
            document.dispatchEvent(new Event("changelog-modified"));
        });
        this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.CHANGES_FOR_FILE, ({changes}) => {
            setChangesForFile(changes);
        });
        this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.ALL_CHANGES, ({changes}) => {
            setAllChanges(changes);
        });
    }

    public appendCommit(commit: ICommit) {
        this.changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.APPEND_COMMIT, {commit});
    }

    public getChangesForFile(filePath: string) {
        this.changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.GET_CHANGES_FOR_FILE, {filePath});
    }

    public getAllChanges() {
        this.changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.GET_ALL_CHANGES);
    }

    private;
}

const [useChangelogWatcherServiceContext, ChangelogWatcherServiceContextProvider] = createGenericContext<Context>();

export const ChangelogWatcherService: React.FC = props => {
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();

    const [changesForFile, setChangesForFile] = React.useState<ISnapshotCommitBundle[]>([]);
    const [allChanges, setAllChanges] = React.useState<ISnapshotCommitBundle[]>([]);

    const appendCommit = React.useCallback((commit: ICommit) => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.APPEND_COMMIT, {commit});
        }
    }, []);

    const getChangesForFile = React.useCallback((filePath: string) => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.GET_CHANGES_FOR_FILE, {filePath});
        }
    }, []);

    const getAllChanges = React.useCallback(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.GET_ALL_CHANGES);
        }
    }, []);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.on(ChangelogWatcherResponseTypes.COMMIT_APPENDED, () => {
                dispatch(
                    addNotification({
                        type: NotificationType.SUCCESS,
                        message: "Commit appended",
                    })
                );
            });
            changelogWatcherWorker.on(ChangelogWatcherResponseTypes.MODIFIED, () => {
                document.dispatchEvent(new Event("changelog-modified"));
            });
            changelogWatcherWorker.on(ChangelogWatcherResponseTypes.CHANGES_FOR_FILE, ({changes}) => {
                setChangesForFile(changes);
            });
            changelogWatcherWorker.on(ChangelogWatcherResponseTypes.ALL_CHANGES, ({changes}) => {
                setAllChanges(changes);
            });
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.SET_DIRECTORY, {directory});
        }
    }, [directory]);

    return (
        <ChangelogWatcherServiceContextProvider
            value={{
                appendCommit,
                getChangesForFile,
                changesForFile,
                getAllChanges,
                allChanges,
            }}
        >
            {props.children}
        </ChangelogWatcherServiceContextProvider>
    );
};

export const useChangelogWatcher = (): Context => useChangelogWatcherServiceContext();
