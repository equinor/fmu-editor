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
    INITIALIZED = "INITIALIZED",
}

export type FileChangesMessages = {
    [FileChangesTopics.FILES_CHANGED]: FileChange[];
    [FileChangesTopics.SNAPSHOT_CHANGED]: undefined;
    [FileChangesTopics.INITIALIZED]: undefined;
};

class FileChangesWatcherService extends ServiceBase<FileChangesMessages> {
    private worker: Webworker<FileChangesRequests, FileChangesResponses>;
    private snapshot: Snapshot | null;

    constructor() {
        super();
        this.worker = new Webworker<FileChangesRequests, FileChangesResponses>({Worker: worker});

        this.worker.on(FileChangesWatcherResponseType.FILE_CHANGES, data => {
            this.messageBus.publish(FileChangesTopics.FILES_CHANGED, data.fileChanges);
        });

        store.subscribe(() => {
            const state = store.getState();
            if (state.files.workingDirectoryPath) {
                this.worker.postMessage(FileChangesWatcherRequestType.SET_WORKING_DIRECTORY_PATH, {
                    workingDirectoryPath: state.files.workingDirectoryPath,
                });
                this.snapshot = new Snapshot(state.files.workingDirectoryPath, environmentService.getUsername());
                this.messageBus.publish(FileChangesTopics.SNAPSHOT_CHANGED);
            }
        });
    }

    public getSnapshot(): Snapshot | null {
        return this.snapshot;
    }
}

export const fileChangesWatcherService = new FileChangesWatcherService();
