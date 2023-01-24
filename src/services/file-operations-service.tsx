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

export enum PushState {
    IDLE = "idle",
    PUSHING = "pushing",
    PUSHED = "pushed",
    FAILED = "failed",
}

export enum PullState {
    IDLE = "idle",
    PULLING = "pulling",
    PULLED = "pulled",
    FAILED = "failed",
}

export enum FileOperationsServiceEventTypes {
    COPY_USER_DIRECTORY_PROGRESS = "COPY_USER_DIRECTORY_PROGRESS",
    PUSH_STATE_CHANGED = "PUSH_STATE_CHANGED",
    PULL_STATE_CHANGED = "PULL_STATE_CHANGED",
}

export interface FileOperationsServiceEvents {
    [FileOperationsServiceEventTypes.COPY_USER_DIRECTORY_PROGRESS]: CustomEvent<
        FileOperationsResponses[FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS]
    >;
    [FileOperationsServiceEventTypes.PUSH_STATE_CHANGED]: CustomEvent<{
        state: PushState;
        notPushedFiles?: string[];
        pushedFiles?: string[];
    }>;
    [FileOperationsServiceEventTypes.PULL_STATE_CHANGED]: CustomEvent<{
        state: PullState;
        notPulledFiles?: string[];
        pulledFiles?: string[];
    }>;
}

declare global {
    interface Document {
        addEventListener<K extends keyof FileOperationsServiceEvents>(
            type: K,
            listener: (this: Document, ev: FileOperationsServiceEvents[K]) => void
        ): void;
        dispatchEvent<K extends keyof FileOperationsServiceEvents>(ev: FileOperationsServiceEvents[K]): void;
        removeEventListener<K extends keyof FileOperationsServiceEvents>(
            type: K,
            listener: (this: Document, ev: FileOperationsServiceEvents[K]) => void
        ): void;
    }
}

export type Context = {
    copyUserDirectory: () => void;
    changedFiles: ChangedFile[] | null;
    pushState: PushState;
    pullState: PullState;
    pushUserChanges: (fileChanges: FileChange[], commitSummary: string, commitDescription: string) => void;
    pullMainChanges: (fileChanges: FileChange[]) => void;
};

const [useFileOperationsContext, FileOperationsContextProvider] = createGenericContext<Context>();

export const FileOperationsService: React.FC = props => {
    const [changedFiles, setChangedFiles] = React.useState<ChangedFile[] | null>(null);
    const [pushState, setPushState] = React.useState<PushState>(PushState.IDLE);
    const [pullState, setPullState] = React.useState<PullState>(PullState.IDLE);
    const environment = useEnvironment();
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const currentDirectory = useAppSelector(state => state.files.directory);

    const pushTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const pullTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        return () => {
            if (pushTimeoutRef.current) {
                clearTimeout(pushTimeoutRef.current);
            }
            if (pullTimeoutRef.current) {
                clearTimeout(pullTimeoutRef.current);
            }
        };
    }, []);

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

    const pushUserChanges = React.useCallback(
        (fileChanges: FileChange[], commitSummary: string, commitDescription: string) => {
            if (fileOperationsWorker) {
                fileOperationsWorker.postMessage(FileOperationsRequestType.PUSH_USER_CHANGES, {
                    fileChanges,
                    commitSummary,
                    commitDescription,
                });
                document.dispatchEvent(
                    new CustomEvent(FileOperationsServiceEventTypes.PUSH_STATE_CHANGED, {
                        detail: {state: PushState.PUSHING},
                    })
                );
                setPushState(PushState.PUSHING);
            }
        },
        []
    );

    const pullMainChanges = React.useCallback((fileChanges: FileChange[]) => {
        if (fileOperationsWorker) {
            fileOperationsWorker.postMessage(FileOperationsRequestType.PULL_MAIN_CHANGES, {
                fileChanges,
            });
            document.dispatchEvent(
                new CustomEvent(FileOperationsServiceEventTypes.PULL_STATE_CHANGED, {
                    detail: {state: PullState.PULLING},
                })
            );
            setPullState(PullState.PULLING);
        }
    }, []);

    React.useEffect(() => {
        if (fileOperationsWorker) {
            fileOperationsWorker.on(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, payload => {
                document.dispatchEvent(
                    new CustomEvent(FileOperationsServiceEventTypes.COPY_USER_DIRECTORY_PROGRESS, {detail: payload})
                );
            });

            fileOperationsWorker.on(FileOperationsResponseType.CHANGED_FILES, payload => {
                setChangedFiles(payload.changedFiles);
            });

            fileOperationsWorker.on(FileOperationsResponseType.USER_CHANGES_PUSHED, payload => {
                const newState = payload.commitMessageWritten ? PushState.PUSHED : PushState.FAILED;
                setPushState(newState);
                pushTimeoutRef.current = setTimeout(() => {
                    setPushState(PushState.IDLE);
                }, 3000);
                document.dispatchEvent(
                    new CustomEvent(FileOperationsServiceEventTypes.PUSH_STATE_CHANGED, {
                        detail: {
                            state: newState,
                            pushedFiles: payload.pushedFiles,
                            notPushedFiles: payload.notPushedFiles,
                        },
                    })
                );
            });

            fileOperationsWorker.on(FileOperationsResponseType.MAIN_CHANGES_PULLED, payload => {
                const newState = payload.success ? PullState.PULLED : PullState.FAILED;
                setPullState(newState);
                pullTimeoutRef.current = setTimeout(() => {
                    setPullState(PullState.IDLE);
                }, 3000);
                document.dispatchEvent(
                    new CustomEvent(FileOperationsServiceEventTypes.PULL_STATE_CHANGED, {
                        detail: {
                            state: newState,
                            pulledFiles: payload.pulledFiles,
                            notPulledFiles: payload.notPulledFiles,
                        },
                    })
                );
            });
        }
    }, [dispatch]);

    return (
        <FileOperationsContextProvider
            value={{
                copyUserDirectory,
                changedFiles,
                pushState,
                pullState,
                pushUserChanges,
                pullMainChanges,
            }}
        >
            {props.children}
        </FileOperationsContextProvider>
    );
};

export const useFileOperationsService = (): Context => useFileOperationsContext();
