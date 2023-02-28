export enum IpcMessages {
    GET_APP_DATA = "get-app-data",
    DISABLE_SAVE_ACTIONS = "disable-save-actions",
    ENABLE_SAVE_ACTIONS = "enable-save-actions",
    SAVE_FILE_AS = "save-file-as",
    SELECT_FILE = "select-file",
    NEW_FILE = "new-file",
    SAVE_FILE = "save-file",
    ERROR = "error",
    LOGGED_IN = "logged-in",
    LOGGED_OUT = "logged-out",
    FILE_OPENED = "file-opened",
    PUSH_NOTIFICATION = "push-notification",
}

export enum IpcDebugMessages {
    RESET = "debug:reset",
}
