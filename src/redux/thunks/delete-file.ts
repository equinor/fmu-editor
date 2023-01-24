import {closeFile} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import { File } from "@utils/file-system/file";

export function deleteFile(filePath: string, workingDirectory: string, dispatch: AppDispatch) {
    const file = new File(filePath, workingDirectory);
    if (file.remove()) {
        dispatch(closeFile(filePath));
        const notification: Notification = {
            type: NotificationType.SUCCESS,
            message: `File '${filePath}' successfully deleted.`,
        };
        dispatch(addNotification(notification));
    }
    else {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not delete file '${filePath}'.`,
        };
        dispatch(addNotification(notification));
    }
}
