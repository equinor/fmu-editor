import {ipcRenderer} from "electron";

import {setFmuDirectoryPath} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {Notification, NotificationType} from "@shared-types/notifications";

export function selectFmuDirectory(fmuDirectory: string, dispatch: AppDispatch) {
    const opts: FileExplorerOptions = {
        isDirectoryExplorer: true,
        title: "Open FMU Directory",
        defaultPath: fmuDirectory,
    };
    ipcRenderer.invoke("select-file", opts).then(result => {
        if (result) {
            dispatch(setFmuDirectoryPath({path: result[0]}));
            const notification: Notification = {
                type: NotificationType.SUCCESS,
                message: `FMU directory successfully set to '${result}'.`,
            };
            dispatch(addNotification(notification));
        }
    });
}
