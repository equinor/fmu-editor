import {notificationsService} from "@services/notifications-service";

import {ipcRenderer} from "electron";

import {setFmuDirectoryPath} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {IpcMessages} from "@shared-types/ipc";
import {Notification, NotificationType} from "@shared-types/notifications";

export async function selectFmuDirectory(
    fmuDirectoryPath: string,
    dispatch: AppDispatch
) : Promise<boolean> {
    const opts: FileExplorerOptions = {
        isDirectoryExplorer: true,
        title: "Open FMU Model Directory",
        defaultPath: fmuDirectoryPath,
    };
    let success = false;
    await ipcRenderer.invoke(IpcMessages.SELECT_FILE, opts).then(result => {
        if (result) {
            dispatch(setFmuDirectoryPath({path: result[0]}));
            const notification: Notification = {
                type: NotificationType.SUCCESS,
                message: `FMU model directory successfully set to '${result}'.`,
            };
            notificationsService.publishNotification(notification);
            success = true;
        } else {
            const notification: Notification = {
                type: NotificationType.WARNING,
                message: `An FMU model directory must be selected to begin working.`,
            };
            notificationsService.publishNotification(notification);
        }
    });
    return success;
}
