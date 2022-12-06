import {FileChangeType} from "./file-changes";

export interface IFile {
    path: string;
    action: FileChangeType;
}

export interface ICommit {
    id: string;
    author: string;
    datetime: Date;
    message: string;
    files: IFile[];
}

export interface ICommitExtended extends ICommit {
    snapshotPath: string | null;
    compareSnapshotPath: string | null;
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
    GET_ALL_CHANGES = "get-all-changes",
}

export enum ChangelogWatcherResponseTypes {
    MODIFIED = "refresh",
    SUCCESS = "success",
    COMMIT_APPENDED = "commit-appended",
    CHANGES_FOR_FILE = "get-changes-for-file",
    ALL_CHANGES = "all-changes",
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
    [ChangelogWatcherRequestTypes.GET_ALL_CHANGES]: {};
};

export type ChangelogWatcherResponses = {
    [ChangelogWatcherResponseTypes.MODIFIED]: {};
    [ChangelogWatcherResponseTypes.SUCCESS]: {};
    [ChangelogWatcherResponseTypes.COMMIT_APPENDED]: {};
    [ChangelogWatcherResponseTypes.CHANGES_FOR_FILE]: {
        changes: ISnapshotCommitBundle[];
    };
    [ChangelogWatcherResponseTypes.ALL_CHANGES]: {
        changes: ISnapshotCommitBundle[];
    };
};
