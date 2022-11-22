export enum FileChangesWatcherRequest {
    SET_DIRECTORY,
}

export enum FileChangesWatcherResponse {
    FILE_CHANGES,
}

export type FileChange = {
    user: string;
    filePath: string;
    modified: Date;
};
