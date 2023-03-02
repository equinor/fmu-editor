/* eslint-disable import/order */

/* eslint-disable import/first */
import {ElectronAuthenticator, MsalElectronConfig} from "@microsoft/mgt-electron-provider/dist/Authenticator";

import {BrowserWindow, app} from "electron";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import * as ElectronLog from "electron-log";
import ElectronStore from "electron-store";

import path from "path";

import {PROCESS_ENV} from "./src/env";
import {initIpc, pushNotification, pushStackedNotifications} from "./src/ipc-messages";
import {createMenu} from "./src/menu";
import {getAppIcon} from "./src/utils";

import {NotificationType} from "../src/shared-types/notifications";

Object.assign(console, ElectronLog.functions);

const isDev = PROCESS_ENV.NODE_ENV === "development";
const appTitle = "FMU Editor";

const msalDeactivated = process.argv.includes("--deactivate-msal");
const msalPersistence = process.argv.includes("--msal-persistence");

initIpc();

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

    if (!msalDeactivated) {
        const config: MsalElectronConfig = {
            clientId: "6f2755e8-06e5-4f2e-8129-029c1c71d347",
            authority: "https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
            mainWindow: win,
            scopes: ["user.readbasic.all"],
            cachePlugin: undefined,
        };

        if (msalPersistence) {
            pushNotification({
                type: NotificationType.INFORMATION,
                message: "Using MSAL persistence",
            });
            await import("@azure/msal-node-extensions").then(
                async ({DataProtectionScope, PersistenceCachePlugin, PersistenceCreator}) => {
                    const persistenceConfiguration = {
                        cachePath: path.join(app.getPath("userData"), "./msal.cache.json"),
                        dataProtectionScope: DataProtectionScope.CurrentUser,
                        serviceName: "fmu-editor-service",
                        accountName: "fmu-editor-account",
                        usePlaintextFileOnLinux: false,
                    };

                    const filePersistence = await PersistenceCreator.createPersistence(persistenceConfiguration);

                    config.cachePlugin = new PersistenceCachePlugin(filePersistence);
                }
            );
        }

        ElectronAuthenticator.initialize(config);
    } else {
        pushNotification({
            type: NotificationType.INFORMATION,
            message: "MSAL deactivated",
        });
    }

    createMenu({allActionsDisabled: true});

    if (isDev) {
        win.loadURL("http://localhost:3000");
    } else {
        win.loadURL(`file://${__dirname}/../index.html`);
    }

    // Hot Reloading
    if (isDev) {
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
    if (isDev) {
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
