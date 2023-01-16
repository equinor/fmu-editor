import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {Webworker} from "@workers/worker-utils";

import {useAppDispatch, useAppSelector} from "@redux/hooks";

import {FileChange} from "@shared-types/file-changes";
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
    copyUserDirectory: () => void;
    changedFiles: ChangedFile[] | null;
    commitState: CommitState;
    commitUserChanges: (fileChanges: FileChange[], commitSummary: string, commitDescription: string) => void;
    notCommittedFiles: string[];
    resetCommitState: () => void;
};

const [useFileOperationsContext, FileOperationsContextProvider] = createGenericContext<Context>();

export const FileOperationsService: React.FC = props => {
    const [changedFiles, setChangedFiles] = React.useState<ChangedFile[] | null>(null);
    const [commitState, setCommitState] = React.useState<CommitState>(CommitState.IDLE);
    const [notCommittedFiles, setNotCommittedFiles] = React.useState<string[]>([]);
    const environment = useEnvironment();
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const currentDirectory = useAppSelector(state => state.files.directory);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (currentDirectory && environment.username) {
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

    const resetCommitState = React.useCallback(() => {
        setCommitState(CommitState.IDLE);
    }, []);

    const commitUserChanges = React.useCallback(
        (fileChanges: FileChange[], commitSummary: string, commitDescription: string) => {
            if (fileOperationsWorker) {
                fileOperationsWorker.postMessage(FileOperationsRequestType.COMMIT_USER_CHANGES, {
                    fileChanges,
                    commitSummary,
                    commitDescription,
                });
                setCommitState(CommitState.COMMITTING);
            }
        },
        []
    );

    React.useEffect(() => {
        if (fileOperationsWorker) {
            fileOperationsWorker.on(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, payload => {
                document.dispatchEvent(new CustomEvent("copyUserDirectoryProgress", {detail: payload}));
            });

            fileOperationsWorker.on(FileOperationsResponseType.CHANGED_FILES, payload => {
                setChangedFiles(payload.changedFiles);
            });

            fileOperationsWorker.on(FileOperationsResponseType.USER_CHANGES_COMMITTED, payload => {
                setCommitState(payload.commitMessageWritten ? CommitState.COMMITTED : CommitState.FAILED);
                setNotCommittedFiles(payload.notCommittedFiles);
            });
        }
    }, [dispatch]);

    return (
        <FileOperationsContextProvider
            value={{
                copyUserDirectory,
                changedFiles,
                commitUserChanges,
                commitState,
                notCommittedFiles,
                resetCommitState,
            }}
        >
            {props.children}
        </FileOperationsContextProvider>
    );
};

export const useFileOperationsService = (): Context => useFileOperationsContext();
