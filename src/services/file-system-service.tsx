import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {Webworker} from "@workers/worker-utils";

import {useAppDispatch, useAppSelector} from "@redux/hooks";

import {
    FileSystemWatcherRequestType,
    FileSystemWatcherRequests,
    FileSystemWatcherResponseType,
    FileSystemWatcherResponses,
} from "@shared-types/file-system-watcher";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import worker from "worker-loader!@workers/file-system-watcher.worker";

import {useEnvironment} from "./environment-service";

const fileSystemWatcherWorker = new Webworker<FileSystemWatcherRequests, FileSystemWatcherResponses>({Worker: worker});

export type Context = {
    currentWorkingDirectoryLastChangedMs: number;
    availableWorkingDirectoriesLastChangedMs: number;
};

const [useFileSystemWatcherServiceContext, FileSystemWatcherServiceContextProvider] = createGenericContext<Context>();

export const FileSystemWatcherService: React.FC = props => {
    const [availableWorkingDirectoriesLastChangedMs, setAvailableWorkingDirectoriesLastChangedMs] =
        React.useState<number>(0);
    const [currentWorkingDirectoryLastChangedMs, setCurrentWorkingDirectoryLastChangedMs] = React.useState<number>(0);

    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const directory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();
    const {username} = useEnvironment();

    React.useEffect(() => {
        if (fileSystemWatcherWorker) {
            fileSystemWatcherWorker.on(FileSystemWatcherResponseType.AVAILABLE_WORKING_DIRECTORIES_CHANGED, () => {
                setAvailableWorkingDirectoriesLastChangedMs(new Date().getTime());
            });
            fileSystemWatcherWorker.on(FileSystemWatcherResponseType.WORKING_DIRECTORY_CONTENT_CHANGED, () => {
                setCurrentWorkingDirectoryLastChangedMs(new Date().getTime());
            });
        }
    }, [dispatch]);

    React.useEffect(() => {
        if (fileSystemWatcherWorker) {
            fileSystemWatcherWorker.postMessage(FileSystemWatcherRequestType.UPDATE_VALUES, {
                fmuDirectory,
                username,
                directory,
            });
        }
    }, [fmuDirectory, username, directory]);

    return (
        <FileSystemWatcherServiceContextProvider
            value={{currentWorkingDirectoryLastChangedMs, availableWorkingDirectoriesLastChangedMs}}
        >
            {props.children}
        </FileSystemWatcherServiceContextProvider>
    );
};

export const useFileSystemWatcher = (): Context => useFileSystemWatcherServiceContext();
