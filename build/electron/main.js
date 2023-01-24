"use strict";
/* eslint-disable import/order */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable import/first */
const terminal_1 = __importDefault(require("../cli/terminal"));
const Authenticator_1 = require("@microsoft/mgt-electron-provider/dist/Authenticator");
const electron_1 = require("electron");
const electron_devtools_installer_1 = __importStar(require("electron-devtools-installer"));
const ElectronLog = __importStar(require("electron-log"));
const electron_store_1 = __importDefault(require("electron-store"));
const fs_1 = __importDefault(require("fs"));
const module_alias_1 = __importDefault(require("module-alias"));
const path = __importStar(require("path"));
const commands_1 = require("./commands");
const env_1 = require("./env");
const menu_1 = require("./menu");
const recent_files_1 = require("./recent-files");
const utils_1 = require("./utils");
Object.assign(console, ElectronLog.functions);
module_alias_1.default.addAliases({
    "@constants": `${__dirname}/../src/constants`,
    "@models": `${__dirname}/../src/models`,
    "@redux": `${__dirname}/../src/redux`,
    "@utils": `${__dirname}/../src/utils`,
    "@src": `${__dirname}/../src/`,
    "@root": `${__dirname}/../`,
});
const isDev = env_1.PROCESS_ENV.NODE_ENV === "development";
const userDataDir = electron_1.app.getPath("userData");
const userHomeDir = electron_1.app.getPath("home");
const appDir = electron_1.app.getAppPath();
const tempFiles = [];
const tempFilesPath = path.resolve(userDataDir, ".tempfiles");
electron_1.ipcMain.on("add-temp-file", (event, file) => {
    tempFiles.push(file);
    try {
        fs_1.default.writeFileSync(tempFilesPath, tempFiles.join("\n"));
    }
    catch (e) {
        event.reply("error", `Could not create temporary file. ${e}`);
    }
});
electron_1.ipcMain.on("get-app-data", event => {
    event.returnValue = {
        version: electron_1.app.getVersion(),
        userDataDir,
        userHomeDir,
        appDir,
        isDev,
    };
});
electron_1.ipcMain.on("disable-save-actions", () => {
    menu_1.createMenu(true);
});
electron_1.ipcMain.on("enable-save-actions", () => {
    menu_1.createMenu();
});
electron_1.ipcMain.handle("select-file", async (event, options) => {
    return commands_1.selectFileDialog(event, options);
});
electron_1.ipcMain.handle("save-file", async (event, options) => {
    return commands_1.saveFileDialog(event, options);
});
electron_1.ipcMain.on("find-python-interpreters", event => {
    commands_1.findPythonInterpreters(event);
});
electron_1.ipcMain.on("check-if-python-interpreter", (event, pythonPath) => {
    event.reply("python-interpreter-check", commands_1.checkIfPythonInterpreter(pythonPath));
});
electron_1.ipcMain.on("get-webviz-themes", (event, pythonInterpreter) => {
    commands_1.findWebvizThemes(pythonInterpreter, event);
});
electron_1.ipcMain.on("set-recent-files", (event, files) => {
    if (files) {
        recent_files_1.RecentFiles.setRecentFiles(files);
    }
    else
        recent_files_1.RecentFiles.setRecentFiles([]);
    menu_1.createMenu();
    event.reply("recent-files-updated");
});
electron_1.ipcMain.on("clear-recent-files", event => {
    recent_files_1.RecentFiles.setRecentFiles([]);
    menu_1.createMenu();
    event.reply("recent-files-cleared");
});
const appTitle = "FMU Editor";
function createWindow() {
    const win = new electron_1.BrowserWindow({
        title: appTitle,
        icon: utils_1.getAppIcon(),
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            nodeIntegrationInSubFrames: true,
            webSecurity: false,
            webviewTag: true
        },
    });
    const config = {
        clientId: "6f2755e8-06e5-4f2e-8129-029c1c71d347",
        authority: "https://login.microsoftonline.com/3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
        mainWindow: win,
        scopes: ["user.readbasic.all"],
    };
    Authenticator_1.ElectronAuthenticator.initialize(config);
    if (isDev) {
        win.loadURL("http://localhost:3000");
    }
    else {
        // 'build/index.html'
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
    menu_1.createMenu();
    return win;
}
const openApplication = async () => {
    await electron_1.app.whenReady();
    if (isDev) {
        // DevTools
        electron_devtools_installer_1.default(electron_devtools_installer_1.REACT_DEVELOPER_TOOLS)
            .then(name => console.log(`Added Extension:  ${name}`))
            .catch(err => console.log("An error occurred: ", err));
    }
    electron_store_1.default.initRenderer();
    createWindow();
    electron_1.app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
    electron_1.app.on("activate", () => {
        try {
            let legacyTempFiles = [];
            if (fs_1.default.existsSync(tempFilesPath)) {
                legacyTempFiles = fs_1.default.readFileSync(tempFilesPath).toString().split("\n");
                fs_1.default.rmSync(tempFilesPath);
            }
            legacyTempFiles.forEach(file => {
                fs_1.default.rmSync(file);
            });
        }
        catch (e) {
            console.log(e);
        }
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    electron_1.app.on("will-quit", () => {
        try {
            tempFiles.forEach(file => {
                fs_1.default.rmSync(file);
            });
            if (fs_1.default.existsSync(tempFilesPath)) {
                fs_1.default.rmSync(tempFilesPath);
            }
        }
        catch (e) {
            console.log(e);
        }
    });
};
openApplication();
if (process.platform === "darwin") {
    terminal_1.default()
        // eslint-disable-next-line no-console
        .catch(e => console.log(e));
}
//# sourceMappingURL=main.js.map