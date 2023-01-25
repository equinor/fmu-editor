import {BrowserWindow, Menu, MenuItemConstructorOptions, app} from "electron";

import * as path from "path";

import {PROCESS_ENV} from "./env";
import {RecentFiles, RecentFilesManager} from "./recent-files";

const isDev = PROCESS_ENV.NODE_ENV === "development";

function createPreviewWindow() {
    const win = new BrowserWindow({
        title: "Preview",
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

    if (isDev) {
        win.loadURL("http://localhost:3000/preview.html");
    } else {
        win.loadURL(`file://${__dirname}/preview.html`);
    }

    return win;
}

export const createMenu = (
    args: {disabledSaveActions?: boolean; allActionsDisabled?: boolean} = {
        disabledSaveActions: false,
        allActionsDisabled: false,
    }
) => {
    const isMac = process.platform === "darwin";

    args.allActionsDisabled = args.allActionsDisabled || false;
    args.disabledSaveActions = args.disabledSaveActions || false;

    const listOfRecentDocuments = RecentFiles.getRecentFiles();
    const recentDocuments = listOfRecentDocuments.map(doc => ({
        label: path.basename(doc),
        click() {
            const window = BrowserWindow.getFocusedWindow();
            if (window) {
                window.webContents.send("file-opened", [doc]);
            }
        },
    }));
    recentDocuments.push({
        label: "Clear Recent",
        click() {
            RecentFilesManager.clearRecentFiles();
        },
    });

    let template = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                  {
                      label: app.name,
                      submenu: [
                          {role: "about"},
                          {type: "separator"},
                          {role: "services"},
                          {type: "separator"},
                          {role: "hide"},
                          {role: "hideOthers"},
                          {role: "unhide"},
                          {type: "separator"},
                          {role: "quit"},
                      ],
                  },
              ]
            : []),
        // { role: 'fileMenu' }
        {
            label: "File",
            enabled: !args.allActionsDisabled,
            submenu: [
                {
                    label: "Save",
                    accelerator: "CmdOrCtrl+S",
                    enabled: !args.disabledSaveActions && !args.allActionsDisabled,
                    click() {
                        const window = BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("save-file");
                        }
                    },
                },
                {
                    label: "Save as...",
                    accelerator: "CmdOrCtrl+Shift+S",
                    enabled: !args.disabledSaveActions && !args.allActionsDisabled,
                    click() {
                        const window = BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("save-file-as");
                        }
                    },
                },
                isMac
                    ? {role: "close", enabled: !args.allActionsDisabled}
                    : {role: "quit", enabled: !args.allActionsDisabled},
            ],
        },
        // { role: 'viewMenu' }
        {
            label: "View",
            enabled: !args.allActionsDisabled,
            submenu: [
                {role: "resetZoom", enabled: !args.allActionsDisabled},
                {role: "zoomIn", enabled: !args.allActionsDisabled},
                {role: "zoomOut", enabled: !args.allActionsDisabled},
                {type: "separator", enabled: !args.allActionsDisabled},
                {role: "togglefullscreen", enabled: !args.allActionsDisabled},
            ],
        },
        // { role: 'windowMenu' }
        {
            label: "Window",
            enabled: !args.allActionsDisabled,
            submenu: [
                {role: "minimize", enabled: !args.allActionsDisabled},
                ...(isMac
                    ? [
                          {type: "separator"},
                          {role: "front", enabled: !args.allActionsDisabled},
                          {type: "separator"},
                          {role: "window", enabled: !args.allActionsDisabled},
                      ]
                    : [{role: "close", enabled: !args.allActionsDisabled}]),
            ],
        },
        {
            role: "help",
            enabled: !args.allActionsDisabled,
            submenu: [
                {
                    label: "Learn More",
                    click: async () => {
                        /* eslint-disable global-require */
                        const {shell} = require("electron");
                        await shell.openExternal("https://equinor.github.io/fmu-editor");
                    },
                    enabled: !args.allActionsDisabled,
                },
                {
                    label: "Report a bug",
                    click: async () => {
                        /* eslint-disable global-require */
                        const {shell} = require("electron");
                        await shell.openExternal("https://github.com/equinor/fmu-editor/issues");
                    },
                    enabled: !args.allActionsDisabled,
                },
            ],
        },
        ...(isDev
            ? [
                  {
                      label: "Debug",
                      submenu: [
                          {role: "reload"},
                          {role: "forceReload"},
                          {type: "separator"},
                          {role: "toggleDevTools"},
                          {
                              label: "Reset Initialization",
                              click(_: any, browserWindow: BrowserWindow) {
                                  browserWindow.webContents.send("debug:reset-init");
                              },
                          },
                          {
                              label: "Open Preview",
                              click(_: any, browserWindow: BrowserWindow) {
                                  createPreviewWindow();
                              },
                          },
                      ],
                  },
              ]
            : []),
    ];

    const menu = Menu.buildFromTemplate(template as Array<MenuItemConstructorOptions>);
    Menu.setApplicationMenu(menu);
};
