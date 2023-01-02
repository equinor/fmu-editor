import React from "react";

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

const changelogWatcherWorker = new Webworker<FileChangesRequests, FileChangesResponses>({Worker: worker});

export type Context = {
    fileChanges: FileChange[];
};

const [useFileChangesWatcherServiceContext, FileChangesWatcherServiceContextProvider] = createGenericContext<Context>();

export const FileChangesWatcherService: React.FC = props => {
    const [fileChanges, setFileChanges] = React.useState<FileChange[]>([]);
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.on(FileChangesWatcherResponseType.FILE_CHANGES, data => {
                setFileChanges(data.fileChanges);
                console.log(data.fileChanges);
            });
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage(FileChangesWatcherRequestType.SET_DIRECTORY, {directory});
        }
    }, [directory]);

    return (
        <FileChangesWatcherServiceContextProvider value={{fileChanges}}>
            {props.children}
        </FileChangesWatcherServiceContextProvider>
    );
};

export const useFileChangesWatcher = (): Context => useFileChangesWatcherServiceContext();
