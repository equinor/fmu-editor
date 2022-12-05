export enum FileOperationsRequestType {
    COPY_USER_DIRECTORY = "COPY_USER_DIRECTORY",
    SET_USER_DIRECTORY = "SET_USER_DIRECTORY",
}

export enum FileOperationsResponseType {
    COPY_USER_DIRECTORY_PROGRESS,
    FILES_REQUIRING_MERGING,
}

export enum FileOperationsStatus {
    SUCCESS,
    ERROR,
    IN_PROGRESS,
}

export type FileOperationsRequests = {
    [FileOperationsRequestType.COPY_USER_DIRECTORY]: {
        username: string;
        directory: string;
    };
    [FileOperationsRequestType.SET_USER_DIRECTORY]: {
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
    [FileOperationsResponseType.FILES_REQUIRING_MERGING]: {
        files: string[];
    };
};
