import {MessageBus} from "@src/framework/message-bus";

import {Webworker} from "@workers/worker-utils";

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

export enum ChangelogWatcherMessageTypes {
    MODIFIED = "MODIFIED",
}

type ChangelogWatcherMessages = {
    [ChangelogWatcherMessageTypes.MODIFIED]: undefined;
};

class ChangelogWatcherService {
    private changelogWatcherWorker: Webworker<ChangelogWatcherRequests, ChangelogWatcherResponses>;
    private messageBus: MessageBus<ChangelogWatcherMessages>;

    constructor() {
        this.messageBus = new MessageBus<ChangelogWatcherMessages>();
        this.changelogWatcherWorker = new Webworker<ChangelogWatcherRequests, ChangelogWatcherResponses>({
            Worker: worker,
        });
        this.changelogWatcherWorker.on(ChangelogWatcherResponseTypes.MODIFIED, () => {
            this.messageBus.publish(ChangelogWatcherMessageTypes.MODIFIED);
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
