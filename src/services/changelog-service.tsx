import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {NotificationType} from "@components/Notifications";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {
    ChangelogWatcherRequest,
    ChangelogWatcherResponse,
    ICommit,
    ISnapshotCommitBundle,
} from "@shared-types/changelog";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import ChangelogWatcherWorker from "worker-loader!@workers/changelog-watcher.worker";

const changelogWatcherWorker = new ChangelogWatcherWorker();

export type Context = {
    appendCommit: (commit: ICommit) => void;
    getChangesForFile: (filePath: string) => void;
    changesForFile: ISnapshotCommitBundle[];
};

const [useChangelogWatcherServiceContext, ChangelogWatcherServiceContextProvider] = createGenericContext<Context>();

export const ChangelogWatcherService: React.FC = props => {
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();

    const [changesForFile, setChangesForFile] = React.useState<ISnapshotCommitBundle[]>([]);

    const appendCommit = React.useCallback((commit: ICommit) => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage({
                type: ChangelogWatcherRequest.APPEND_COMMIT,
                commit,
            });
        }
    }, []);

    const getChangesForFile = React.useCallback((filePath: string) => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage({
                type: ChangelogWatcherRequest.GET_CHANGES_FOR_FILE,
                filePath,
            });
        }
    }, []);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.onmessage = (e: MessageEvent) => {
                const data = e.data;
                switch (data.type) {
                    case ChangelogWatcherResponse.COMMIT_APPENDED:
                        dispatch(
                            addNotification({
                                type: NotificationType.SUCCESS,
                                message: "Commit appended",
                            })
                        );
                        break;
                    case ChangelogWatcherResponse.MODIFIED:
                        document.dispatchEvent(new Event("changelog-modified"));
                        break;
                    case ChangelogWatcherResponse.CHANGES_FOR_FILE:
                        setChangesForFile(data.changes);
                        break;
                    default:
                }
            };
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage({
                type: ChangelogWatcherRequest.SET_DIRECTORY,
                directory,
            });
        }
    }, [directory]);

    return (
        <ChangelogWatcherServiceContextProvider
            value={{
                appendCommit,
                getChangesForFile,
                changesForFile,
            }}
        >
            {props.children}
        </ChangelogWatcherServiceContextProvider>
    );
};

export const useChangelogWatcher = (): Context => useChangelogWatcherServiceContext();
