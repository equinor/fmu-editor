import {BrowserWindow, app, clipboard, ipcMain} from "electron";

import {saveFileDialog, selectFileDialog} from "./commands";
import {IS_DEV, NO_MSAL} from "./env";
import {createMenu} from "./menu";

import {FileExplorerOptions, FileOptions} from "../../src/shared-types/file-explorer-options";
import {IpcMessages} from "../../src/shared-types/ipc";
import {Notification} from "../../src/shared-types/notifications";

let signedIn = NO_MSAL;

export const initIpc = () => {
    const userDataDir = app.getPath("userData");
    const userHomeDir = app.getPath("home");
    const appDir = app.getAppPath();

    ipcMain.on(IpcMessages.GET_APP_DATA, event => {
        event.returnValue = {
            version: app.getVersion(),
            userDataDir,
            userHomeDir,
            appDir,
            isDev: IS_DEV,
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

    ipcMain.on(IpcMessages.INSPECT_ELEMENT, async (_, x: number, y: number) => {
        const window = BrowserWindow.getFocusedWindow();
        if (window) {
            window.webContents.openDevTools();
            window.webContents.inspectElement(x, y);
        }
    });

    ipcMain.on(IpcMessages.LOGGED_OUT, async () => {
        createMenu({allActionsDisabled: true});
        signedIn = false;
    });

    ipcMain.handle(IpcMessages.WRITE_TO_CLIPBOARD, async (_, text: string) => {
        clipboard.writeText(text, "clipboard");
        if (clipboard.readText("clipboard") === text) {
            return true;
        }
        return false;
    });

    ipcMain.handle(IpcMessages.READ_FROM_CLIPBOARD, async () => {
        return clipboard.readText("clipboard");
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
