export enum FileChangesWatcherRequestType {
    SET_DIRECTORY,
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

export type FileChange = {
    type: FileChangeType;
    relativePath: string;
    user?: string;
    main: boolean;
    modified?: number;
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
