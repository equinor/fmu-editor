export enum FileChangesWatcherRequestType {
    SET_WORKING_DIRECTORY_PATH,
}

export enum FileChangesWatcherResponseType {
    FILE_CHANGES,
    NO_USER_DIRECTORY,
}

export enum FileChangeType {
    MODIFIED = "modified",
    ADDED = "added",
    DELETED = "deleted",
}

export enum FileChangeOrigin {
    MAIN = "main",
    USER = "user",
    BOTH = "both",
}

export type FileChange = {
    type: FileChangeType;
    relativePath: string;
    user?: string;
    origin: FileChangeOrigin;
    modified?: number;
};

export type FileChangesRequests = {
    [FileChangesWatcherRequestType.SET_WORKING_DIRECTORY_PATH]: {
        workingDirectoryPath: string;
    };
};

export type FileChangesResponses = {
    [FileChangesWatcherResponseType.FILE_CHANGES]: {
        fileChanges: FileChange[];
    };
};
