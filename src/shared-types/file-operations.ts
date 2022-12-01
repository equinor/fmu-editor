export enum FileOperationsRequestType {
    COPY_USER_DIRECTORY
}

export enum FileOperationsResponseType {
    COPY_USER_DIRECTORY_PROGRESS
}

export enum FileOperationsStatus {
    SUCCESS,
    ERROR,
    IN_PROGRESS
}

type PayloadMap<
    M extends { 
        [index: string]:
        | { [key: string]:
            | string 
            | string[] 
            | number 
            | number[] 
            | Record<string, unknown>;
        }
    }
> = {
    [K in keyof M]: M[K] extends undefined 
        ? { 
            type: K 
        } 
        : { 
            type: K; 
            payload: M[K]; 
        };
};

type Requests = {
    [FileOperationsRequestType.COPY_USER_DIRECTORY]: {
        username: string;
        directory: string;
    }
};

export type FileOperationsRequests = PayloadMap<Requests>[keyof PayloadMap<Requests>];

type Responses = {
    [FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS]: {
        progress: number;
        status: FileOperationsStatus;
        message?: string;
    }
};

export type FileOperationsResponses = PayloadMap<Responses>[keyof PayloadMap<Responses>];
