import {GlobalSettings} from "@global/global-settings";
import {notificationsService} from "@services/notifications-service";

import {addFile} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import path from "path";

export function openFile(
    filePath: string,
    workingDirectoryPath: string,
    dispatch: AppDispatch,
    permanentOpen = false
) {
    try {
        const file = new File(path.relative(workingDirectoryPath, filePath), workingDirectoryPath);
        const mightBeBinary = file.mightBeBinary();
        const fileContent = file.readString() || "";
        dispatch(addFile({filePath, fileContent, permanentOpen, mightBeBinary}));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not open file '${filePath}'. ${e}`,
        };
        notificationsService.publishNotification(notification);
    }
}
