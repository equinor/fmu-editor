"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMenu = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const commands_1 = require("./commands");
const env_1 = require("./env");
const recent_files_1 = require("./recent-files");
const isDev = env_1.PROCESS_ENV.NODE_ENV === "development";
function createPreviewWindow() {
    const win = new electron_1.BrowserWindow({
        title: "Preview",
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
    if (isDev) {
        win.loadURL("http://localhost:3000/preview.html");
    }
    else {
        // 'build/index.html'
        win.loadURL(`file://${__dirname}/../preview.html`);
    }
    return win;
}
const createMenu = (disabledSaveActions = false) => {
    const isMac = process.platform === "darwin";
    const listOfRecentDocuments = recent_files_1.RecentFiles.getRecentFiles();
    const recentDocuments = listOfRecentDocuments.map(doc => ({
        label: path.basename(doc),
        click() {
            const window = electron_1.BrowserWindow.getFocusedWindow();
            if (window) {
                window.webContents.send("file-opened", [doc]);
            }
        },
    }));
    recentDocuments.push({
        label: "Clear Recent",
        click() {
            recent_files_1.RecentFilesManager.clearRecentFiles();
        },
    });
    let template = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                {
                    label: electron_1.app.name,
                    submenu: [
                        { role: "about" },
                        { type: "separator" },
                        { role: "services" },
                        { type: "separator" },
                        { role: "hide" },
                        { role: "hideOthers" },
                        { role: "unhide" },
                        { type: "separator" },
                        { role: "quit" },
                    ],
                },
            ]
            : []),
        // { role: 'fileMenu' }
        {
            label: "File",
            submenu: [
                {
                    label: "New File",
                    accelerator: "CmdOrCtrl+N",
                    click() {
                        const window = electron_1.BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("new-file");
                        }
                    },
                },
                {
                    label: "Open File...",
                    accelerator: "CmdOrCtrl+O",
                    click() {
                        commands_1.openFile();
                    },
                },
                {
                    label: "Open Recent",
                    submenu: recentDocuments,
                },
                {
                    label: "Save",
                    accelerator: "CmdOrCtrl+S",
                    enabled: !disabledSaveActions,
                    click() {
                        const window = electron_1.BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("save-file");
                        }
                    },
                },
                {
                    label: "Save as...",
                    accelerator: "CmdOrCtrl+Shift+S",
                    enabled: !disabledSaveActions,
                    click() {
                        const window = electron_1.BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("save-file-as");
                        }
                    },
                },
                isMac ? { role: "close" } : { role: "quit" },
            ],
        },
        // { role: 'viewMenu' }
        {
            label: "View",
            submenu: [
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
        // { role: 'windowMenu' }
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                ...(isMac
                    ? [
                        { type: "separator" },
                        { role: "front" },
                        { type: "separator" },
                        { role: "window" },
                    ]
                    : [{ role: "close" }]),
            ],
        },
        {
            role: "help",
            submenu: [
                {
                    label: "Learn More",
                    click: async () => {
                        /* eslint-disable global-require */
                        const { shell } = require("electron");
                        await shell.openExternal("https://equinor.github.io/webviz-subsurface");
                    },
                },
                {
                    label: "Report a bug",
                    click: async () => {
                        /* eslint-disable global-require */
                        const { shell } = require("electron");
                        await shell.openExternal("https://github.com/equinor/webviz-config-editor/issues");
                    },
                },
            ],
        },
        ...(isDev
            ? [
                {
                    label: "Debug",
                    submenu: [
                        { role: "reload" },
                        { role: "forceReload" },
                        { type: "separator" },
                        { role: "toggleDevTools" },
                        {
                            label: "Reset Initialization",
                            click(_, browserWindow) {
                                browserWindow.webContents.send("debug:reset-init");
                            },
                        },
                        {
                            label: "Open Preview",
                            click(_, browserWindow) {
                                createPreviewWindow();
                            },
                        }
                    ],
                },
            ]
            : []),
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
};
exports.createMenu = createMenu;
//# sourceMappingURL=menu.js.map