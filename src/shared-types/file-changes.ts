export enum FileChangesWatcherRequestType {
    SET_DIRECTORY,
}

export enum FileChangesWatcherResponseType {
    FILE_CHANGES,
    NO_USER_DIRECTORY,
}

export enum FileChangeType {
    MODIFIED,
    ADDED,
    DELETED
}

export type FileChange = {
    user: string;
    filePath: string;
    type: FileChangeType;
    modified: Date;
};

export type FileChangesRequests = {
    [FileChangesWatcherRequestType.SET_DIRECTORY]: {
        directory: string;
    };
};

export type FileChangesResponses = {
    [FileChangesWatcherResponseType.FILE_CHANGES]: {
        fileChanges: FileChange[];
    };
};
