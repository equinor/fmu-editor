export enum FileSystemWatcherRequestType {
    UPDATE_VALUES = "UPDATE_VALUES",
}

export enum FileSystemWatcherResponseType {
    AVAILABLE_WORKING_DIRECTORIES_CHANGED = "AVAILABLE_WORKING_DIRECTORIES_CHANGED",
    WORKING_DIRECTORY_CONTENT_CHANGED = "WORKING_DIRECTORY_CONTENT_CHANGED",
}

export type FileSystemWatcherRequests = {
    [FileSystemWatcherRequestType.UPDATE_VALUES]: {
        username: string;
        workingDirectory: string;
        fmuDirectory: string;
    };
};

export type FileSystemWatcherResponses = {
    [FileSystemWatcherResponseType.AVAILABLE_WORKING_DIRECTORIES_CHANGED]: {};
    [FileSystemWatcherResponseType.WORKING_DIRECTORY_CONTENT_CHANGED]: {};
};
