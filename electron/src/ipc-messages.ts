import {BrowserWindow, app, ipcMain} from "electron";

import {saveFileDialog, selectFileDialog} from "./commands";
import {PROCESS_ENV} from "./env";
import {createMenu} from "./menu";

import {FileExplorerOptions, FileOptions} from "../../src/shared-types/file-explorer-options";
import {IpcMessages} from "../../src/shared-types/ipc";
import {Notification} from "../../src/shared-types/notifications";

let signedIn = false;

export const initIpc = () => {
    const isDev = PROCESS_ENV.NODE_ENV === "development";

    const userDataDir = app.getPath("userData");
    const userHomeDir = app.getPath("home");
    const appDir = app.getAppPath();

    ipcMain.on(IpcMessages.GET_APP_DATA, event => {
        event.returnValue = {
            version: app.getVersion(),
            userDataDir,
            userHomeDir,
            appDir,
            isDev,
        };
    });

    ipcMain.on(IpcMessages.DISABLE_SAVE_ACTIONS, () => {
        if (!signedIn) return;
        createMenu({disabledSaveActions: true});
    });

    ipcMain.on(IpcMessages.ENABLE_SAVE_ACTIONS, () => {
        if (!signedIn) return;
        createMenu();
    });

    ipcMain.handle(IpcMessages.SELECT_FILE, async (event, options: FileExplorerOptions) => {
        return selectFileDialog(event, options);
    });

    ipcMain.handle(IpcMessages.SAVE_FILE_AS, async (event, options: FileOptions) => {
        return saveFileDialog(event, options);
    });

    ipcMain.on(IpcMessages.LOGGED_IN, async () => {
        createMenu();
        signedIn = true;
    });

    ipcMain.on(IpcMessages.LOGGED_OUT, async () => {
        createMenu({allActionsDisabled: true});
        signedIn = false;
    });
};

let notificationStack: Notification[] = [];

export const pushNotification = (notification: Notification) => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        window.webContents.send(IpcMessages.PUSH_NOTIFICATION, notification);
    } else {
        notificationStack.push(notification);
    }
};

export const pushStackedNotifications = () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        notificationStack.forEach(notification => {
            pushNotification(notification);
        });
        notificationStack = [];
    }
};
