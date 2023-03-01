import {notificationsService} from "@services/notifications-service";

import {ipcRenderer} from "electron";

import {setFmuDirectoryPath} from "@redux/reducers/files";
import {AppDispatch} from "@redux/store";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {Notification, NotificationType} from "@shared-types/notifications";

export function selectFmuDirectory(fmuDirectoryPath: string, dispatch: AppDispatch) {
    const opts: FileExplorerOptions = {
        isDirectoryExplorer: true,
        title: "Open FMU Directory",
        defaultPath: fmuDirectoryPath,
    };
    ipcRenderer.invoke("select-file", opts).then(result => {
        if (result) {
            dispatch(setFmuDirectoryPath({path: result[0]}));
            const notification: Notification = {
                type: NotificationType.SUCCESS,
                message: `FMU directory successfully set to '${result}'.`,
            };
            notificationsService.publishNotification(notification);
        }
    });
}
