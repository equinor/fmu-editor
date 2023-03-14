import {notificationsService} from "@services/notifications-service";

import {File} from "@utils/file-system/file";

import {addFile} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {GlobalSettings} from "@shared-types/global-settings";
import {Notification, NotificationType} from "@shared-types/notifications";

import path from "path";

export function openFile(
    filePath: string,
    workingDirectoryPath: string,
    dispatch: AppDispatch,
    globalSettings: GlobalSettings,
    permanentOpen = false
) {
    if (!globalSettings.supportedFileExtensions.includes(path.extname(filePath))) {
        const notification = {
            type: NotificationType.WARNING,
            message: `Can only open files with the following extensions: ${globalSettings.supportedFileExtensions.join(
                ", "
            )}.`,
        };
        notificationsService.publishNotification(notification);
        return;
    }
    try {
        const file = new File(path.relative(workingDirectoryPath, filePath), workingDirectoryPath);
        dispatch(addFile({filePath, fileContent: file.readString() || "", permanentOpen}));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not open file '${filePath}'. ${e}`,
        };
        notificationsService.publishNotification(notification);
    }
}
