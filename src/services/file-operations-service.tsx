import {MessageBus} from "@src/framework/message-bus";

import {Webworker} from "@workers/worker-utils";

import store from "@redux/store";

import {FileChange} from "@shared-types/file-changes";
import {
    FileOperationsRequestType,
    FileOperationsRequests,
    FileOperationsResponseType,
    FileOperationsResponses,
} from "@shared-types/file-operations";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import FileOperationsWorker from "worker-loader!@workers/file-operations.worker";

import {environmentService} from "./environment-service";
import {ServiceBase} from "./service-base";

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

export enum FileOperationsTopics {
    COPY_USER_DIRECTORY_PROGRESS = "COPY_USER_DIRECTORY_PROGRESS",
    PUSH_STATE_CHANGED = "PUSH_STATE_CHANGED",
    PULL_STATE_CHANGED = "PULL_STATE_CHANGED",
}

export type FileOperationsMessages = {
    [FileOperationsTopics.COPY_USER_DIRECTORY_PROGRESS]: FileOperationsResponses[FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS];
    [FileOperationsTopics.PUSH_STATE_CHANGED]: {
        state: PushState;
        notPushedFilesPaths?: string[];
        pushedFilesPaths?: string[];
    };
    [FileOperationsTopics.PULL_STATE_CHANGED]: {
        state: PullState;
        notPulledFilesPaths?: string[];
        pulledFilesPaths?: string[];
    };
};

class FileOperationsService extends ServiceBase<FileOperationsMessages> {
    private worker: Webworker<FileOperationsRequests, FileOperationsResponses>;

    constructor() {
        super();

        this.worker = new Webworker<FileOperationsRequests, FileOperationsResponses>({
            Worker: FileOperationsWorker,
        });

        this.worker.on(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, progress => {
            this.messageBus.publish(FileOperationsTopics.COPY_USER_DIRECTORY_PROGRESS, progress);
        });

        this.messageBus = new MessageBus<FileOperationsMessages>();
    }

    public copyUserDirectory(): Promise<
        FileOperationsResponses[FileOperationsResponseType.USER_DIRECTORY_INITIALIZED]
    > {
        return new Promise((resolve, reject) => {
            const username = environmentService.getUsername();
            const workingDirectoryPath = store.getState().files.workingDirectoryPath;

            if (this.worker && environmentService.getUsername()) {
                this.worker.postMessage(FileOperationsRequestType.COPY_USER_DIRECTORY, {
                    username,
                    directory: workingDirectoryPath,
                });

                this.worker.on(FileOperationsResponseType.USER_DIRECTORY_INITIALIZED, payload => {
                    resolve({
                        success: payload.success,
                        errorMessage: payload.errorMessage,
                    });
                });
            } else {
                reject();
            }
        });
    }

    public pushUserChanges(
        fileChanges: FileChange[],
        commitSummary: string,
        commitDescription: string
    ): Promise<FileOperationsResponses[FileOperationsResponseType.USER_CHANGES_PUSHED]> {
        return new Promise((resolve, reject) => {
            const username = environmentService.getUsername();
            const workingDirectoryPath = store.getState().files.workingDirectoryPath;

            if (this.worker && environmentService.getUsername()) {
                this.worker.postMessage(FileOperationsRequestType.PUSH_USER_CHANGES, {
                    username,
                    directory: workingDirectoryPath,
                    fileChanges,
                    commitSummary,
                    commitDescription,
                });

                this.messageBus.publish(FileOperationsTopics.PUSH_STATE_CHANGED, {
                    state: PushState.PUSHING,
                });

                this.worker.on(FileOperationsResponseType.USER_CHANGES_PUSHED, payload => {
                    this.messageBus.publish(FileOperationsTopics.PUSH_STATE_CHANGED, {
                        state: payload.commitMessageWritten ? PushState.PUSHED : PushState.FAILED,
                        notPushedFilesPaths: payload.notPushedFilesPaths,
                        pushedFilesPaths: payload.pushedFilesPaths,
                    });
                    resolve(payload);
                });
            } else {
                reject();
            }
        });
    }

    public pullMainChanges(
        fileChanges: FileChange[]
    ): Promise<FileOperationsResponses[FileOperationsResponseType.MAIN_CHANGES_PULLED]> {
        return new Promise((resolve, reject) => {
            const username = environmentService.getUsername();
            const workingDirectoryPath = store.getState().files.workingDirectoryPath;

            if (this.worker && environmentService.getUsername()) {
                this.worker.postMessage(FileOperationsRequestType.PULL_MAIN_CHANGES, {
                    username,
                    directory: workingDirectoryPath,
                    fileChanges,
                });

                this.messageBus.publish(FileOperationsTopics.PULL_STATE_CHANGED, {
                    state: PullState.PULLING,
                });

                this.worker.on(FileOperationsResponseType.MAIN_CHANGES_PULLED, payload => {
                    this.messageBus.publish(FileOperationsTopics.PULL_STATE_CHANGED, {
                        state: payload.success ? PullState.PULLED : PullState.FAILED,
                        notPulledFilesPaths: payload.notPulledFilesPaths,
                        pulledFilesPaths: payload.pulledFilesPaths,
                    });
                    resolve(payload);
                });
            } else {
                reject();
            }
        });
    }
}

export const fileOperationsService = new FileOperationsService();
