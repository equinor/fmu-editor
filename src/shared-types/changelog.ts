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

export enum ChangelogWatcherRequest {
    SET_DIRECTORY = "set-directory",
    APPEND_COMMIT = "append-commit",
    GET_CHANGES_FOR_FILE = "get-changes-for-file",
}

export enum ChangelogWatcherResponse {
    MODIFIED = "refresh",
    SUCCESS = "success",
    COMMIT_APPENDED = "commit-appended",
    CHANGES_FOR_FILE = "get-changes-for-file",
}
