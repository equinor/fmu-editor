import {GlobalSettings} from "@global/global-settings";
import {notificationsService} from "@services/notifications-service";

import {addFile} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import path from "path";

export function openFile(filePath: string, workingDirectoryPath: string, dispatch: AppDispatch, permanentOpen = false) {
    if (!GlobalSettings.supportedFileExtensions().includes(path.extname(filePath))) {
        const notification = {
            type: NotificationType.WARNING,
            message: `Can only open files with the following extensions: ${GlobalSettings.supportedFileExtensions().join(
                ", "
            )}.`,
        };
        notificationsService.publishNotification(notification);
        return;
    }
    try {
        dispatch(addFile({filePath, permanentOpen}));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not open file '${filePath}'. ${e}`,
        };
        notificationsService.publishNotification(notification);
    }
}
