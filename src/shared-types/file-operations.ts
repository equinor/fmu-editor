import {FileChangeType} from "./file-changes";

export enum FileOperationsRequestType {
    COPY_USER_DIRECTORY = "COPY_USER_DIRECTORY",
    SET_USER_DIRECTORY = "SET_USER_DIRECTORY",
    INIT_USER_DIRECTORY = "INIT_USER_DIRECTORY",
}

export enum FileOperationsResponseType {
    COPY_USER_DIRECTORY_PROGRESS,
    CHANGED_FILES,
    USER_DIRECTORY_INITIALIZED,
}

export enum FileOperationsStatus {
    SUCCESS,
    ERROR,
    IN_PROGRESS,
}

export type ChangedFile = {
    type: FileChangeType;
    filePath: string;
    mergingRequired: boolean;
};

export type FileOperationsRequests = {
    [FileOperationsRequestType.COPY_USER_DIRECTORY]: {
        username: string;
        directory: string;
    };
    [FileOperationsRequestType.SET_USER_DIRECTORY]: {
        username: string;
        directory: string;
    };
    [FileOperationsRequestType.INIT_USER_DIRECTORY]: {
        username: string;
        directory: string;
    };
};

export type FileOperationsResponses = {
    [FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS]: {
        progress: number;
        status: FileOperationsStatus;
        message?: string;
    };
    [FileOperationsResponseType.CHANGED_FILES]: {
        changedFiles: ChangedFile[];
    };
    [FileOperationsResponseType.USER_DIRECTORY_INITIALIZED]: {};
};
