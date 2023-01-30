/* eslint-disable import/order */

/* eslint-disable import/first */
// import {DataProtectionScope, PersistenceCachePlugin, PersistenceCreator} from "@azure/msal-node-extensions";
import {ElectronAuthenticator, MsalElectronConfig} from "@microsoft/mgt-electron-provider/dist/Authenticator";

import {BrowserWindow, app} from "electron";
import installExtension, {REACT_DEVELOPER_TOOLS} from "electron-devtools-installer";
import * as ElectronLog from "electron-log";
import ElectronStore from "electron-store";

import moduleAlias from "module-alias";
import path from "path";

import {PROCESS_ENV} from "./env";
import {initIpc} from "./ipc-messages";
import {createMenu} from "./menu";
import {getAppIcon} from "./utils";

import terminal from "../cli/terminal";

Object.assign(console, ElectronLog.functions);
moduleAlias.addAliases({
    "@constants": `${__dirname}/../src/constants`,
    "@models": `${__dirname}/../src/models`,
    "@redux": `${__dirname}/../src/redux`,
    "@utils": `${__dirname}/../src/utils`,
    "@src": `${__dirname}/../src/`,
    "@root": `${__dirname}/../`,
    "@shared-types": `${__dirname}/../src/shared-types`,
});

const isDev = PROCESS_ENV.NODE_ENV === "development";
const appTitle = "FMU Editor";

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

    /* NOT AVAILABLE AS LONG AS WE ARE RUNNING ON RHEL 7 (due to glibc version)

    const persistenceConfiguration = {
        cachePath: path.join(app.getPath("userData"), "./msal.cache.json"),
        dataProtectionScope: DataProtectionScope.CurrentUser,
        serviceName: "fmu-editor-service",
        accountName: "fmu-editor-account",
        usePlaintextFileOnLinux: false,
    };

    const filePersistence = await PersistenceCreator.createPersistence(persistenceConfiguration);
    */

    const config: MsalElectronConfig = {
        clientId: "6f2755e8-06e5-4f2e-8129-029c1c71d347",
        authority: "https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
        mainWindow: win,
        scopes: ["user.readbasic.all"],
        // cachePlugin: new PersistenceCachePlugin(filePersistence),
    };
    ElectronAuthenticator.initialize(config);

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
    createWindow();

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

if (process.platform === "darwin") {
    terminal()
        // eslint-disable-next-line no-console
        .catch(e => console.log(e));
}
