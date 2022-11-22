import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setFileChanges} from "@redux/reducers/files";

import {FileChangesWatcherRequest, FileChangesWatcherResponse} from "@shared-types/file-changes";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import FileChangesWatcherWorker from "worker-loader!@workers/file-changes-watcher.worker";

const changelogWatcherWorker = new FileChangesWatcherWorker();

export type Context = {};

const [useFileChangesWatcherServiceContext, FileChangesWatcherServiceContextProvider] = createGenericContext<Context>();

export const FileChangesWatcherService: React.FC = props => {
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (changelogWatcherWorker) {
            changelogWatcherWorker.onmessage = (e: MessageEvent) => {
                const data = e.data;
                switch (data.type) {
                    case FileChangesWatcherResponse.FILE_CHANGES:
                        dispatch(setFileChanges(data.fileChanges));
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
        <FileChangesWatcherServiceContextProvider value={{}}>{props.children}</FileChangesWatcherServiceContextProvider>
    );
};

export const useFileChangesWatcher = (): Context => useFileChangesWatcherServiceContext();
