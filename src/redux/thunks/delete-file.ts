import {closeFile} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import fs from "fs";

export function deleteFile(filePath: string, dispatch: AppDispatch) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            dispatch(closeFile(filePath));
        }
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not delete file '${filePath}'. ${e}`,
        };
        dispatch(addNotification(notification));
    }
}
