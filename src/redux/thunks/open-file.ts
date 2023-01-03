import {FileManager} from "@utils/file-manager";

import {addFile} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {GlobalSettings} from "@shared-types/global-settings";
import {Notification, NotificationType} from "@shared-types/notifications";

import path from "path";

export function openFile(
    filePath: string,
    fileManager: FileManager,
    dispatch: AppDispatch,
    globalSettings: GlobalSettings,
    permanentOpen = false
) {
    if (!globalSettings.supportedFileExtensions.includes(path.extname(filePath))) {
        dispatch(
            addNotification({
                type: NotificationType.WARNING,
                message: `Can only open files with the following extensions: ${globalSettings.supportedFileExtensions.join(
                    ", "
                )}.`,
            } as Notification)
        );
        return;
    }
    try {
        const result = fileManager.readFile(filePath);
        dispatch(addFile({filePath, userFilePath: result.filePath, fileContent: result.content, permanentOpen}));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not open file '${filePath}'. ${e}`,
        };
        dispatch(addNotification(notification));
    }
}
