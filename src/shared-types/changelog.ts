export interface ICommit {
    id: string;
    author: string;
    datetime: Date;
    message: string;
    files: string[];
}

export type ISnapshotCommitBundle = {
    snapshotPath: string | null;
    modified: Date;
    commits: ICommit[];
};

export interface ISnapshot {
    path: string;
    modified: Date;
}

export interface IGlobalChangelog {
    directory: string;
    created: Date;
    modified: Date;
    log: ISnapshotCommitBundle[];
}

export interface ILocalChangelog {
    directory: string;
    created: Date;
    modified: Date;
    log: ICommit[];
}

export enum ChangelogWatcherRequestTypes {
    SET_DIRECTORY = "set-directory",
    APPEND_COMMIT = "append-commit",
    GET_CHANGES_FOR_FILE = "get-changes-for-file",
}

export enum ChangelogWatcherResponseTypes {
    MODIFIED = "refresh",
    SUCCESS = "success",
    COMMIT_APPENDED = "commit-appended",
    CHANGES_FOR_FILE = "get-changes-for-file",
}

export type ChangelogWatcherRequests = {
    [ChangelogWatcherRequestTypes.SET_DIRECTORY]: {
        directory: string;
    };
    [ChangelogWatcherRequestTypes.APPEND_COMMIT]: {
        commit: ICommit;
    };
    [ChangelogWatcherRequestTypes.GET_CHANGES_FOR_FILE]: {
        filePath: string;
    };
};

export type ChangelogWatcherResponses = {
    [ChangelogWatcherResponseTypes.MODIFIED]: {};
    [ChangelogWatcherResponseTypes.SUCCESS]: {};
    [ChangelogWatcherResponseTypes.COMMIT_APPENDED]: {};
    [ChangelogWatcherResponseTypes.CHANGES_FOR_FILE]: {
        changes: ISnapshotCommitBundle[];
    };
};
