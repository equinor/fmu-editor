import {FileChange, FileChangeType} from "./file-changes";

export enum FileOperationsRequestType {
    COPY_USER_DIRECTORY = "COPY_USER_DIRECTORY",
    SET_USER_DIRECTORY = "SET_USER_DIRECTORY",
    INIT_USER_DIRECTORY = "INIT_USER_DIRECTORY",
    COMMIT_USER_CHANGES = "COMMIT_USER_CHANGES",
}

export enum FileOperationsResponseType {
    COPY_USER_DIRECTORY_PROGRESS,
    CHANGED_FILES,
    USER_DIRECTORY_INITIALIZED,
    USER_CHANGES_COMMITTED,
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
    [FileOperationsRequestType.COMMIT_USER_CHANGES]: {
        fileChanges: FileChange[];
        commitSummary: string;
        commitDescription: string;
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
    [FileOperationsResponseType.USER_CHANGES_COMMITTED]: {
        notCommittedFiles: string[];
        commitMessageWritten: boolean;
    };
};
