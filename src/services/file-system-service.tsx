import {MessageBus} from "@src/framework/message-bus";

import {Webworker} from "@workers/worker-utils";

import store from "@redux/store";

import {
    FileSystemWatcherRequestType,
    FileSystemWatcherRequests,
    FileSystemWatcherResponseType,
    FileSystemWatcherResponses,
} from "@shared-types/file-system-watcher";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import worker from "worker-loader!@workers/file-system-watcher.worker";

import {EnvironmentServiceTopics, environmentService} from "./environment-service";

export enum FileSystemWatcherTopics {
    AVAILABLE_WORKING_DIRECTORIES_CHANGED = "AVAILABLE_WORKING_DIRECTORIES_CHANGED",
    WORKING_DIRECTORY_CONTENT_CHANGED = "WORKING_DIRECTORY_CONTENT_CHANGED",
}

type FileSystemWatcherMessages = {
    [FileSystemWatcherTopics.AVAILABLE_WORKING_DIRECTORIES_CHANGED]: undefined;
    [FileSystemWatcherTopics.WORKING_DIRECTORY_CONTENT_CHANGED]: undefined;
};

class FileSystemWatcherService {
    private fileSystemWatcherWorker: Webworker<FileSystemWatcherRequests, FileSystemWatcherResponses>;
    private messageBus: MessageBus<FileSystemWatcherMessages>;
    private username: string;
    private fmuDirectoryPath: string;
    private workingDirectoryPath: string;

    constructor() {
        this.fileSystemWatcherWorker = new Webworker<FileSystemWatcherRequests, FileSystemWatcherResponses>({
            Worker: worker,
        });

        this.messageBus = new MessageBus<FileSystemWatcherMessages>();

        this.username = environmentService.getUsername();
        this.fmuDirectoryPath = store.getState().files.fmuDirectoryPath;
        this.workingDirectoryPath = store.getState().files.workingDirectoryPath;
        this.notifyWorkerAboutChanges();

        store.subscribe(() => {
            const {fmuDirectoryPath, workingDirectoryPath} = store.getState().files;
            if (fmuDirectoryPath === this.fmuDirectoryPath && workingDirectoryPath === this.workingDirectoryPath) {
                return;
            }

            this.fmuDirectoryPath = fmuDirectoryPath;
            this.workingDirectoryPath = workingDirectoryPath;
            this.notifyWorkerAboutChanges();
        });

        environmentService.getMessageBus().subscribe(EnvironmentServiceTopics.USERNAME_CHANGED, ({username}) => {
            if (username === this.username) {
                return;
            }

            this.username = username;
            this.notifyWorkerAboutChanges();
        });

        this.fileSystemWatcherWorker.on(FileSystemWatcherResponseType.AVAILABLE_WORKING_DIRECTORIES_CHANGED, () => {
            this.messageBus.publish(FileSystemWatcherTopics.AVAILABLE_WORKING_DIRECTORIES_CHANGED);
        });

        this.fileSystemWatcherWorker.on(FileSystemWatcherResponseType.WORKING_DIRECTORY_CONTENT_CHANGED, () => {
            this.messageBus.publish(FileSystemWatcherTopics.WORKING_DIRECTORY_CONTENT_CHANGED);
        });
    }

    public getMessageBus(): MessageBus<FileSystemWatcherMessages> {
        return this.messageBus;
    }

    private notifyWorkerAboutChanges(): void {
        this.fileSystemWatcherWorker.postMessage(FileSystemWatcherRequestType.UPDATE_VALUES, {
            fmuDirectory: this.fmuDirectoryPath,
            username: this.username,
            workingDirectory: this.workingDirectoryPath,
        });
    }
}

export const fileSystemWatcherService = new FileSystemWatcherService();
