export enum LogEntryType {
    INFO,
    SUCCESS,
    WARNING,
    ERROR,
}

export interface LogEntry {
    readonly type: LogEntryType;
    datetimeMs: number;
    message: string;
}

export interface Info extends LogEntry {
    readonly type: LogEntryType.INFO;
}

export interface Success extends LogEntry {
    readonly type: LogEntryType.SUCCESS;
}

export interface Warning extends LogEntry {
    readonly type: LogEntryType.WARNING;
}

export interface Error extends LogEntry {
    readonly type: LogEntryType.ERROR;
}
