import {BrowserWindow, app, dialog} from "electron";

import {
    FileExplorerOptions,
    FileOptions,
} from "@shared-types/file-explorer-options";

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
                window.webContents.send("file-opened", fileObj.filePaths);
            }
        })
        .catch(err => {
            console.error(err);
        });
};

export const selectFileDialog = (
    event: Electron.IpcMainInvokeEvent,
    options: FileExplorerOptions
) => {
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

/**
 * prompts to select a file using the native dialogs
 */

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
