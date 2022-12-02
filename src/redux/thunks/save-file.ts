import {FileManager} from "@utils/file-manager";

import {changeFilePath, markAsSaved} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import fs from "fs";

export enum SaveFileResult {
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
    NO_USER_DIRECTORY = "NO_USER_DIRECTORY",
}

export function saveFile(
    filePath: string,
    value: string,
    fileManager: FileManager,
    dispatch: AppDispatch
): SaveFileResult {
    if (!fileManager.userDirectoryExists()) {
        return SaveFileResult.NO_USER_DIRECTORY;
    }
    const result = fileManager.saveFile(filePath, value);
    if (result.success) {
        dispatch(markAsSaved({filePath, userFilePath: result.filePath}));
        const notification: Notification = {
            type: NotificationType.SUCCESS,
            message: `${result.filePath} successfully saved.`,
        };
        dispatch(addNotification(notification));
        return SaveFileResult.SUCCESS;
    }
    return SaveFileResult.ERROR;
}

export function saveFileAs(oldFilePath: string, newFilePath: string, value: string, dispatch: AppDispatch) {
    try {
        fs.writeFileSync(newFilePath, value, {
            encoding: "utf-8",
            flag: "w",
        });
        dispatch(changeFilePath({oldFilePath, newFilePath}));
        const notification: Notification = {
            type: NotificationType.SUCCESS,
            message: `${newFilePath} successfully saved.`,
        };
        dispatch(addNotification(notification));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not save file '${newFilePath}'. ${e}`,
        };
        dispatch(addNotification(notification));
    }
}
