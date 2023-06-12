import {notificationsService} from "@services/notifications-service";

import {addFile} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

export function openFile(filePath: string, workingDirectoryPath: string, dispatch: AppDispatch, permanentOpen = false) {
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
