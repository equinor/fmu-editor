import React from "react";

import {Snapshot} from "@utils/file-system/snapshot";
import {createGenericContext} from "@utils/generic-context";

import {Webworker} from "@workers/worker-utils";

import {useAppDispatch, useAppSelector} from "@redux/hooks";

import {
    FileChange,
    FileChangesRequests,
    FileChangesResponses,
    FileChangesWatcherRequestType,
    FileChangesWatcherResponseType,
} from "@shared-types/file-changes";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import worker from "worker-loader!@workers/file-changes-watcher.worker";

import {useEnvironment} from "./environment-service";

const changelogWatcherWorker = new Webworker<FileChangesRequests, FileChangesResponses>({Worker: worker});

export type Context = {
    fileChanges: FileChange[];
    initialized: boolean;
    snapshot: Snapshot | null;
};

const [useFileChangesWatcherServiceContext, FileChangesWatcherServiceContextProvider] = createGenericContext<Context>();

export const FileChangesWatcherService: React.FC = props => {
    const [fileChanges, setFileChanges] = React.useState<FileChange[]>([]);
    const [initialized, setInitialized] = React.useState(false);
    const snapshot = React.useRef<Snapshot>(null);
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();
    const {username} = useEnvironment();

    React.useEffect(() => {
        if (username && directory) {
            snapshot.current = new Snapshot(directory, username);
        }
    }, [username, directory]);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.on(FileChangesWatcherResponseType.FILE_CHANGES, data => {
                setFileChanges(data.fileChanges);
                setInitialized(true);
            });
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage(FileChangesWatcherRequestType.SET_DIRECTORY, {directory});
        }
    }, [directory]);

    return (
        <FileChangesWatcherServiceContextProvider value={{fileChanges, snapshot: snapshot.current, initialized}}>
            {props.children}
        </FileChangesWatcherServiceContextProvider>
    );
};

export const useFileChangesWatcher = (): Context => useFileChangesWatcherServiceContext();
