import {FileChangeType} from "./file-changes";

export interface IFile {
    path: string;
    action: FileChangeType;
}

export interface ICommit {
    id: string;
    author: string;
    datetime: number;
    message: string;
    files: IFile[];
}

export interface ICommitExtended extends ICommit {
    snapshotPath: string | null;
    compareSnapshotPath: string | null;
}

export type ISnapshotCommitBundle = {
    snapshotPath: string | null;
    modified: number;
    commits: ICommit[];
};

export interface ISnapshot {
    path: string;
    modified: number;
}

export interface IGlobalChangelog {
    directory: string;
    created: number;
    modified: number;
    log: ISnapshotCommitBundle[];
}

export interface ILocalChangelog {
    directory: string;
    created: number;
    modified: number;
    log: ICommit[];
}

export enum ChangelogWatcherRequestTypes {
    SET_WORKING_DIRECTORY = "set-working-directory",
    APPEND_COMMIT = "append-commit",
    GET_CHANGES_FOR_FILE = "get-changes-for-file",
    GET_ALL_CHANGES = "get-all-changes",
}

export enum ChangelogWatcherResponseTypes {
    MODIFIED = "modified",
    SUCCESS = "success",
    COMMIT_APPENDED = "commit-appended",
    CHANGES_FOR_FILE = "changes-for-file",
    ALL_CHANGES = "all-changes",
    ERROR = "error",
}

export type ChangelogWatcherRequests = {
    [ChangelogWatcherRequestTypes.SET_WORKING_DIRECTORY]: {
        workingDirectoryPath: string;
    };
    [ChangelogWatcherRequestTypes.APPEND_COMMIT]: {
        commit: ICommit;
    };
    [ChangelogWatcherRequestTypes.GET_CHANGES_FOR_FILE]: {
        relativeFilePath: string;
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
    [ChangelogWatcherResponseTypes.ERROR]: {
        error: string;
    };
};
