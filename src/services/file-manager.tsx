import React from "react";

import {FileManager} from "@utils/file-manager";
import {createGenericContext} from "@utils/generic-context";

import {Webworker} from "@workers/worker-utils";

import {useAppSelector} from "@redux/hooks";

import {
    FileOperationsRequestType,
    FileOperationsRequests,
    FileOperationsResponseType,
    FileOperationsResponses,
} from "@shared-types/file-operations";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import FileOperationsWorker from "worker-loader!@workers/file-operations.worker";

import {useEnvironment} from "./environment-service";

const fileOperationsWorker = new Webworker<FileOperationsRequests, FileOperationsResponses>({
    Worker: FileOperationsWorker,
});

export type Context = {
    fileManager: FileManager;
    copyUserDirectory: () => void;
};

const [useFileManagerContext, FileManagerContextProvider] = createGenericContext<Context>();

export const FileManagerService: React.FC = props => {
    const environment = useEnvironment();
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const currentDirectory = useAppSelector(state => state.files.directory);

    const fileManager = React.useRef<FileManager>(new FileManager());

    React.useEffect(() => {
        if (fileManager.current && environment.username) {
            fileManager.current.setFmuDirectory(fmuDirectory);
            fileManager.current.setUsername(environment.username);
            fileManager.current.setCurrentDirectory(currentDirectory);

            fileOperationsWorker.postMessage(FileOperationsRequestType.SET_USER_DIRECTORY, {
                username: environment.username,
                directory: currentDirectory,
            });
        }
    }, [environment.username, fmuDirectory, currentDirectory]);

    const copyUserDirectory = React.useCallback(() => {
        if (fileOperationsWorker && environment.username) {
            fileOperationsWorker.postMessage(FileOperationsRequestType.COPY_USER_DIRECTORY, {
                username: environment.username,
                directory: currentDirectory,
            });
        }
    }, [environment, currentDirectory]);

    React.useEffect(() => {
        if (fileOperationsWorker) {
            fileOperationsWorker.on(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, payload => {
                document.dispatchEvent(new CustomEvent("copyUserDirectoryProgress", {detail: payload}));
            });
        }
    }, []);

    return (
        <FileManagerContextProvider
            value={{
                fileManager: fileManager.current,
                copyUserDirectory,
            }}
        >
            {props.children}
        </FileManagerContextProvider>
    );
};

export const useFileManager = (): Context => useFileManagerContext();
