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

import {environmentService} from "./environment-service";

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
    private unsubscribeFunc: () => void;
    private username: string;

    constructor() {
        this.fileSystemWatcherWorker = new Webworker<FileSystemWatcherRequests, FileSystemWatcherResponses>({
            Worker: worker,
        });

        this.username = environmentService.getUsername();

        this.messageBus = new MessageBus<FileSystemWatcherMessages>();

        this.unsubscribeFunc = store.subscribe(() => {
            const {fmuDirectoryPath, workingDirectoryPath} = store.getState().files;
            this.updateValues(fmuDirectoryPath, workingDirectoryPath);
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

    destructor() {
        this.unsubscribeFunc();
    }

    public updateValues(fmuDirectory: string, directory: string): void {
        this.fileSystemWatcherWorker.postMessage(FileSystemWatcherRequestType.UPDATE_VALUES, {
            fmuDirectory,
            username: this.username,
            directory,
        });
    }
}

export const fileSystemWatcherService = new FileSystemWatcherService();
