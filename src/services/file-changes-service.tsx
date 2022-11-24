import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {useAppDispatch, useAppSelector} from "@redux/hooks";

import {FileChange, FileChangesWatcherRequest, FileChangesWatcherResponse} from "@shared-types/file-changes";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import FileChangesWatcherWorker from "worker-loader!@workers/file-changes-watcher.worker";

const changelogWatcherWorker = new FileChangesWatcherWorker();

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
            changelogWatcherWorker.onmessage = (e: MessageEvent) => {
                const data = e.data;
                switch (data.type) {
                    case FileChangesWatcherResponse.FILE_CHANGES:
                        setFileChanges(data.fileChanges);
                        break;
                    default:
                }
            };
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.postMessage({
                type: FileChangesWatcherRequest.SET_DIRECTORY,
                directory,
            });
        }
    }, [directory]);

    return (
        <FileChangesWatcherServiceContextProvider value={{fileChanges}}>
            {props.children}
        </FileChangesWatcherServiceContextProvider>
    );
};

export const useFileChangesWatcher = (): Context => useFileChangesWatcherServiceContext();
