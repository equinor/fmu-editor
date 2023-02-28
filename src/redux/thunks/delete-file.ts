import {notificationsService} from "@services/notifications-service";

import {File} from "@utils/file-system/file";

import {closeFile} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

export function deleteFile(filePath: string, workingDirectory: string, dispatch: AppDispatch) {
    const file = new File(filePath, workingDirectory);
    if (file.remove()) {
        dispatch(closeFile(filePath));
        const notification: Notification = {
            type: NotificationType.SUCCESS,
            message: `File '${filePath}' successfully deleted.`,
        };
        notificationsService.publishNotification(notification);
    } else {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not delete file '${filePath}'.`,
        };
        notificationsService.publishNotification(notification);
    }
}
