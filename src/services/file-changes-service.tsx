import {Snapshot} from "@utils/file-system/snapshot";

import {Webworker} from "@workers/worker-utils";

import store from "@redux/store";

import {
    FileChange,
    FileChangesRequests,
    FileChangesResponses,
    FileChangesWatcherRequestType,
    FileChangesWatcherResponseType,
} from "@shared-types/file-changes";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import worker from "worker-loader!@workers/file-changes-watcher.worker";

import {environmentService} from "./environment-service";
import {ServiceBase} from "./service-base";

export enum FileChangesTopics {
    FILES_CHANGED = "FILES_CHANGED",
    SNAPSHOT_CHANGED = "SNAPSHOT_CHANGED",
    INITIALIZATION_STATE_CHANGED = "INITIALIZATION_STATE_CHANGED",
}

export type FileChangesMessages = {
    [FileChangesTopics.FILES_CHANGED]: {
        fileChanges: FileChange[];
    };
    [FileChangesTopics.SNAPSHOT_CHANGED]: undefined;
    [FileChangesTopics.INITIALIZATION_STATE_CHANGED]: {
        initialized: boolean;
    };
};

class FileChangesWatcherService extends ServiceBase<FileChangesMessages> {
    private worker: Webworker<FileChangesRequests, FileChangesResponses>;
    private snapshot: Snapshot | null;
    private initialized: boolean;
    private workingDirectoryPath: string;

    constructor() {
        super();
        this.worker = new Webworker<FileChangesRequests, FileChangesResponses>({Worker: worker});
        this.initialized = false;

        this.worker.on(FileChangesWatcherResponseType.FILE_CHANGES, data => {
            this.messageBus.publish(FileChangesTopics.FILES_CHANGED, {
                fileChanges: data.fileChanges,
            });
            this.messageBus.publish(FileChangesTopics.INITIALIZATION_STATE_CHANGED, {
                initialized: true,
            });
            this.initialized = true;
        });

        store.subscribe(() => {
            const state = store.getState();
            if (this.workingDirectoryPath !== state.files.workingDirectoryPath) {
                this.initialized = false;
                this.messageBus.publish(FileChangesTopics.INITIALIZATION_STATE_CHANGED, {
                    initialized: false,
                });

                this.worker.postMessage(FileChangesWatcherRequestType.SET_WORKING_DIRECTORY_PATH, {
                    workingDirectoryPath: state.files.workingDirectoryPath,
                });

                this.snapshot = new Snapshot(state.files.workingDirectoryPath, environmentService.getUsername());
                this.messageBus.publish(FileChangesTopics.SNAPSHOT_CHANGED);

                this.workingDirectoryPath = state.files.workingDirectoryPath;
            }
        });
    }

    public getSnapshot(): Snapshot | null {
        return this.snapshot;
    }

    public isInitialized(): boolean {
        return this.initialized;
    }
}

export const fileChangesWatcherService = new FileChangesWatcherService();
