/* eslint-disable import/order */

/* eslint-disable import/first */
import {BrowserWindow, app} from "electron";
import contextMenu from "electron-context-menu";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import * as ElectronLog from "electron-log";
import ElectronStore from "electron-store";

import path from "path";

import {IS_DEV} from "./src/env";
import {initIpc, pushStackedNotifications} from "./src/ipc-messages";
import {createMenu} from "./src/menu";
import {getAppIcon} from "./src/utils";

Object.assign(console, ElectronLog.functions);

const appTitle = "FMU Editor";

initIpc();

contextMenu({
    showInspectElement: IS_DEV,
});

async function createWindow() {
    const win = new BrowserWindow({
        title: appTitle,
        icon: getAppIcon(),
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            nodeIntegrationInSubFrames: true,
            webSecurity: false,
            webviewTag: true,
        },
    });

    createMenu({allActionsDisabled: true});

    if (IS_DEV) {
        win.loadURL("http://localhost:3000");
    } else {
        win.loadURL(`file://${__dirname}/../index.html`);
    }

    // Hot Reloading
    if (IS_DEV) {
        // 'node_modules/.bin/electronPath'
        /* eslint-disable global-require */
        require("electron-reload")(__dirname, {
            electron: path.join(__dirname, "..", "..", "node_modules", ".bin", "electron"),
            forceHardReset: true,
            hardResetMethod: "exit",
        });
    }

    return win;
}

const openApplication = async () => {
    await app.whenReady();
    if (!IS_DEV) {
        // DevTools
        installExtension(REACT_DEVELOPER_TOOLS)
            .then(name => console.log(`Added Extension:  ${name}`))
            .catch(err => console.log("An error occurred: ", err));
    }

    ElectronStore.initRenderer();
    const mainWindow = createWindow();
    (await mainWindow).on("show", () => pushStackedNotifications());

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
};

openApplication();
