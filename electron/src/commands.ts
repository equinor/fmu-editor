import {BrowserWindow, dialog} from "electron";

import {
    FileExplorerOptions,
    FileOptions,
} from "../../src/shared-types/file-explorer-options";
import { IpcMessages } from "../../src/shared-types/ipc";

export const openFile = () => {
    dialog
        .showOpenDialog({
            properties: ["openFile"],
            filters: [
                {
                    name: "Webviz Config Files",
                    extensions: ["yml", "yaml"],
                },
            ],
        })
        .then((fileObj: Electron.OpenDialogReturnValue) => {
            const window = BrowserWindow.getFocusedWindow();
            if (!fileObj.canceled && window) {
                window.webContents.send(IpcMessages.FILE_OPENED, fileObj.filePaths);
            }
        })
        .catch(err => {
            const window = BrowserWindow.getFocusedWindow();
            if (window) {
                window.webContents.send(IpcMessages.ERROR, err);
            }
        });
};

export const selectFileDialog = (
    event: Electron.IpcMainInvokeEvent,
    options: FileExplorerOptions
): string[] | undefined => {
    const browserWindow = BrowserWindow.fromId(event.sender.id);
    let dialogOptions: Electron.OpenDialogSyncOptions = {};
    if (options.isDirectoryExplorer) {
        dialogOptions.properties = ["openDirectory"];
    } else {
        if (options.allowMultiple) {
            dialogOptions.properties = ["multiSelections"];
        }
        if (options.filters) {
            dialogOptions.filters = options.filters;
        }
    }

    dialogOptions.properties?.push("createDirectory");

    if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
    }

    if (browserWindow) {
        return dialog.showOpenDialogSync(browserWindow, dialogOptions);
    }
    return dialog.showOpenDialogSync(dialogOptions);
};

export const saveFileDialog = (
    event: Electron.IpcMainInvokeEvent,
    options: FileOptions
) => {
    const browserWindow = BrowserWindow.fromId(event.sender.id);
    let dialogOptions: Electron.SaveDialogSyncOptions = {};
    if (options.filters) {
        dialogOptions.filters = options.filters;
    }

    dialogOptions.properties?.push("createDirectory");

    if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
    }

    if (options.title) {
        dialogOptions.title = options.title;
    }

    if (browserWindow) {
        return dialog.showSaveDialogSync(browserWindow, dialogOptions);
    }
    return dialog.showSaveDialogSync(dialogOptions);
};
