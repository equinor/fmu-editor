/* eslint-disable import/order */

/* eslint-disable import/first */
import terminal from "../cli/terminal";

import {BrowserWindow, app, ipcMain} from "electron";
import installExtension, {
    REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import * as ElectronLog from "electron-log";
import ElectronStore from "electron-store";

import {
    FileExplorerOptions,
    FileOptions,
} from "@shared-types/file-explorer-options";

import fs from "fs";
import moduleAlias from "module-alias";
import * as path from "path";

import {
    checkIfPythonInterpreter,
    findPythonInterpreters,
    findWebvizThemes,
    saveFileDialog,
    selectFileDialog,
} from "./commands";
import {PROCESS_ENV} from "./env";
import {createMenu} from "./menu";
import {RecentFiles} from "./recent-files";
import {getAppIcon} from "./utils";

Object.assign(console, ElectronLog.functions);
moduleAlias.addAliases({
    "@constants": `${__dirname}/../src/constants`,
    "@models": `${__dirname}/../src/models`,
    "@redux": `${__dirname}/../src/redux`,
    "@utils": `${__dirname}/../src/utils`,
    "@src": `${__dirname}/../src/`,
    "@root": `${__dirname}/../`,
});

const isDev = PROCESS_ENV.NODE_ENV === "development";

const userDataDir = app.getPath("userData");
const userHomeDir = app.getPath("home");
const appDir = app.getAppPath();

const tempFiles: string[] = [];
const tempFilesPath = path.resolve(userDataDir, ".tempfiles");

ipcMain.on("add-temp-file", (event, file: string) => {
    tempFiles.push(file);
    try {
        fs.writeFileSync(tempFilesPath, tempFiles.join("\n"));
    } catch (e) {
        event.reply("error", `Could not create temporary file. ${e}`);
    }
});

ipcMain.on("get-app-data", event => {
    event.returnValue = {
        version: app.getVersion(),
        userDataDir,
        userHomeDir,
        appDir,
        isDev,
    };
});

ipcMain.on("disable-save-actions", () => {
    createMenu(true);
});

ipcMain.on("enable-save-actions", () => {
    createMenu();
});

ipcMain.handle("select-file", async (event, options: FileExplorerOptions) => {
    return selectFileDialog(event, options);
});

ipcMain.handle("save-file", async (event, options: FileOptions) => {
    return saveFileDialog(event, options);
});

ipcMain.on("find-python-interpreters", event => {
    findPythonInterpreters(event);
});

ipcMain.on("check-if-python-interpreter", (event, pythonPath) => {
    event.reply(
        "python-interpreter-check",
        checkIfPythonInterpreter(pythonPath)
    );
});

ipcMain.on("get-webviz-themes", (event, pythonInterpreter) => {
    findWebvizThemes(pythonInterpreter, event);
});

ipcMain.on("set-recent-files", (event, files: string[]) => {
    if (files) {
        RecentFiles.setRecentFiles(files);
    } else RecentFiles.setRecentFiles([]);
    createMenu();
    event.reply("recent-files-updated");
});

ipcMain.on("clear-recent-files", event => {
    RecentFiles.setRecentFiles([]);
    createMenu();
    event.reply("recent-files-cleared");
});

const appTitle = "Webviz Config Editor";

function createWindow() {
    const win = new BrowserWindow({
        title: appTitle,
        icon: getAppIcon(),
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            webSecurity: false,
        },
    });

    if (isDev) {
        win.loadURL("http://localhost:3000");
    } else {
        // 'build/index.html'
        win.loadURL(`file://${__dirname}/../index.html`);
    }

    // Hot Reloading
    if (isDev) {
        // 'node_modules/.bin/electronPath'
        /* eslint-disable global-require */
        require("electron-reload")(__dirname, {
            electron: path.join(
                __dirname,
                "..",
                "..",
                "node_modules",
                ".bin",
                "electron"
            ),
            forceHardReset: true,
            hardResetMethod: "exit",
        });
    }

    createMenu();

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
        try {
            let legacyTempFiles: string[] = [];
            if (fs.existsSync(tempFilesPath)) {
                legacyTempFiles = fs
                    .readFileSync(tempFilesPath)
                    .toString()
                    .split("\n");
                fs.rmSync(tempFilesPath);
            }
            legacyTempFiles.forEach(file => {
                fs.rmSync(file);
            });
        } catch (e) {
            console.log(e);
        }
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.on("will-quit", () => {
        try {
            tempFiles.forEach(file => {
                fs.rmSync(file);
            });
            if (fs.existsSync(tempFilesPath)) {
                fs.rmSync(tempFilesPath);
            }
        } catch (e) {
            console.log(e);
        }
    });
};

openApplication();

if (process.platform === 'darwin') {
    terminal()
        // eslint-disable-next-line no-console
        .catch(e => console.log(e));
}
