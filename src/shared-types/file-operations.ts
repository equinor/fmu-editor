import {FileChange, FileChangeType} from "./file-changes";

export enum FileOperationsRequestType {
    COPY_USER_DIRECTORY = "COPY_USER_DIRECTORY",
    SET_USER_DIRECTORY = "SET_USER_DIRECTORY",
    INIT_USER_DIRECTORY = "INIT_USER_DIRECTORY",
    PUSH_USER_CHANGES = "PUSH_USER_CHANGES",
    PULL_MAIN_CHANGES = "PULL_MAIN_CHANGES",
}

export enum FileOperationsResponseType {
    COPY_USER_DIRECTORY_PROGRESS,
    CHANGED_FILES,
    USER_DIRECTORY_INITIALIZED,
    USER_CHANGES_PUSHED,
    MAIN_CHANGES_PULLED,
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
    [FileOperationsRequestType.PUSH_USER_CHANGES]: {
        fileChanges: FileChange[];
        commitSummary: string;
        commitDescription: string;
    };
    [FileOperationsRequestType.PULL_MAIN_CHANGES]: {
        fileChanges: FileChange[];
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
    [FileOperationsResponseType.USER_CHANGES_PUSHED]: {
        pushedFiles: string[];
        notPushedFiles: string[];
        commitMessageWritten: boolean;
    };
    [FileOperationsResponseType.MAIN_CHANGES_PULLED]: {
        pulledFiles: string[];
        notPulledFiles: string[];
        success: boolean;
    };
};
