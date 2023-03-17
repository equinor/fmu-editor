import {MessageBus} from "@src/framework/message-bus";

import {Webworker} from "@workers/worker-utils";

import store from "@redux/store";

import {
    ChangelogWatcherRequestTypes,
    ChangelogWatcherRequests,
    ChangelogWatcherResponseTypes,
    ChangelogWatcherResponses,
    ICommit,
    ISnapshotCommitBundle,
} from "@shared-types/changelog";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import worker from "worker-loader!@workers/changelog-watcher.worker";

import {ServiceBase} from "./service-base";

export enum ChangelogWatcherTopics {
    MODIFIED = "MODIFIED",
}

export type ChangelogWatcherMessages = {
    [ChangelogWatcherTopics.MODIFIED]: undefined;
};

class ChangelogWatcherService extends ServiceBase<ChangelogWatcherMessages> {
    private changelogWatcherWorker: Webworker<ChangelogWatcherRequests, ChangelogWatcherResponses>;

    constructor() {
        super();
        this.changelogWatcherWorker = new Webworker<ChangelogWatcherRequests, ChangelogWatcherResponses>({
            Worker: worker,
        });

        this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.MODIFIED, () => {
            this.messageBus.publish(ChangelogWatcherTopics.MODIFIED);
        });

        store.subscribe(() => {
            const {workingDirectoryPath} = store.getState().files;
            this.changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.SET_WORKING_DIRECTORY, {
                workingDirectoryPath,
            });
        });
    }

    public getMessageBus(): MessageBus<ChangelogWatcherMessages> {
        return this.messageBus;
    }

    public appendCommit(commit: ICommit): Promise<void> {
        return new Promise((resolve, reject) => {
            this.changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.APPEND_COMMIT, {commit});
            this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.COMMIT_APPENDED, () => {
                resolve();
            });
            this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.ERROR, ({error}) => {
                reject(error);
            });
        });
    }

    public getChangesForFile(filePath: string): Promise<ISnapshotCommitBundle[]> {
        return new Promise((resolve, reject) => {
            this.changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.GET_CHANGES_FOR_FILE, {filePath});
            this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.CHANGES_FOR_FILE, ({changes}) => {
                resolve(changes);
            });
            this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.ERROR, ({error}) => {
                reject(error);
            });
        });
    }

    public getAllChanges(): Promise<ISnapshotCommitBundle[]> {
        return new Promise((resolve, reject) => {
            this.changelogWatcherWorker.postMessage(ChangelogWatcherRequestTypes.GET_ALL_CHANGES);
            this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.ALL_CHANGES, ({changes}) => {
                resolve(changes);
            });
            this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.ERROR, ({error}) => {
                reject(error);
            });
        });
    }
}

export const changelogWatcherService = new ChangelogWatcherService();
