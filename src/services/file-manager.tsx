import React from "react";

import {FileManager} from "@utils/file-manager";
import {createGenericContext} from "@utils/generic-context";

import {Webworker} from "@workers/worker-utils";

import {useAppDispatch, useAppSelector} from "@redux/hooks";

import {
    ChangedFile,
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

export enum CommitState {
    IDLE = "idle",
    COMMITTING = "committing",
    COMMITTED = "committed",
    FAILED = "failed",
}

export type Context = {
    fileManager: FileManager;
    copyUserDirectory: () => void;
    changedFiles: ChangedFile[] | null;
    commitState: CommitState;
    commitUserChanges: (files: string[]) => void;
};

const [useFileManagerContext, FileManagerContextProvider] = createGenericContext<Context>();

export const FileManagerService: React.FC = props => {
    const [changedFiles, setChangedFiles] = React.useState<ChangedFile[] | null>(null);
    const [commitState, setCommitState] = React.useState<CommitState>(CommitState.IDLE);
    const environment = useEnvironment();
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const currentDirectory = useAppSelector(state => state.files.directory);

    const fileManager = React.useRef<FileManager>(new FileManager());
    const dispatch = useAppDispatch();

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

    const commitUserChanges = React.useCallback((files: string[]) => {
        if (fileOperationsWorker) {
            fileOperationsWorker.postMessage(FileOperationsRequestType.COMMIT_USER_CHANGES, {
                files,
            });
            setCommitState(CommitState.COMMITTING);
        }
    }, []);

    React.useEffect(() => {
        if (fileOperationsWorker) {
            fileOperationsWorker.on(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, payload => {
                document.dispatchEvent(new CustomEvent("copyUserDirectoryProgress", {detail: payload}));
            });

            fileOperationsWorker.on(FileOperationsResponseType.CHANGED_FILES, payload => {
                setChangedFiles(payload.changedFiles);
            });

            fileOperationsWorker.on(FileOperationsResponseType.USER_CHANGES_COMMITTED, payload => {
                setCommitState(payload.success ? CommitState.COMMITTED : CommitState.FAILED);
            });
        }
    }, [dispatch]);

    return (
        <FileManagerContextProvider
            value={{
                fileManager: fileManager.current,
                copyUserDirectory,
                changedFiles,
                commitUserChanges,
                commitState,
            }}
        >
            {props.children}
        </FileManagerContextProvider>
    );
};

export const useFileManager = (): Context => useFileManagerContext();
