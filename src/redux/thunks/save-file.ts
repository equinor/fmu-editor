import {editor} from "@editors/editor";
import {notificationsService} from "@services/notifications-service";

import {File} from "@utils/file-system/file";

import {changeFilePath, markAsSaved} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import path from "path";

export function saveFile(filePath: string, workingDirectoryPath: string, dispatch: AppDispatch): void {
    const file = new File(path.relative(workingDirectoryPath, filePath), workingDirectoryPath);

    if (editor.saveFile(filePath)) {
        dispatch(markAsSaved(filePath));
        const notification: Notification = {
            type: NotificationType.SUCCESS,
            message: `${file.relativePath()} successfully saved.`,
        };
        notificationsService.publishNotification(notification);
        return;
    }
    const notification: Notification = {
        type: NotificationType.ERROR,
        message: `${file.relativePath()} could not be saved.`,
    };
    notificationsService.publishNotification(notification);
}

export function saveFileAs(
    oldFilePath: string,
    newFilePath: string,
    workingDirectoryPath: string,
    dispatch: AppDispatch
) {
    const file = new File(path.relative(workingDirectoryPath, newFilePath), workingDirectoryPath);

    if (editor.saveFileAs(oldFilePath, file.absolutePath())) {
        dispatch(changeFilePath({oldFilePath, newFilePath}));
        const notification: Notification = {
            type: NotificationType.SUCCESS,
            message: `${file.relativePath()} successfully saved.`,
        };
        notificationsService.publishNotification(notification);
    } else {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not save file '${file.relativePath()}'.`,
        };
        notificationsService.publishNotification(notification);
    }
}
