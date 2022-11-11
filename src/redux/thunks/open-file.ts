import {addFile} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";
import { FileManager } from "@utils/file-manager";

export function openFile(filePath: string, fileManager: FileManager, dispatch: AppDispatch) {
    try {
        const result = fileManager.readFile(filePath);
        dispatch(addFile({filePath, userFilePath: result.filePath, fileContent: result.content}));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not open file '${filePath}'. ${e}`,
        };
        dispatch(addNotification(notification));
    }
}
