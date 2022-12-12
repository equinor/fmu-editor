import {BrowserWindow, Menu, MenuItemConstructorOptions, app} from "electron";

import * as path from "path";

import {openFile} from "./commands";
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
            webviewTag: true 
        },
    });

    if (isDev) {
        win.loadURL("http://localhost:3000/preview.html");
    } else {
        // 'build/index.html'
        win.loadURL(`file://${__dirname}/../preview.html`);
    }

    return win;
}

export const createMenu = (disabledSaveActions = false) => {
    const isMac = process.platform === "darwin";

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
            submenu: [
                {
                    label: "New File",
                    accelerator: "CmdOrCtrl+N",
                    click() {
                        const window = BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("new-file");
                        }
                    },
                },
                {
                    label: "Open File...",
                    accelerator: "CmdOrCtrl+O",
                    click() {
                        openFile();
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
                        const window = BrowserWindow.getFocusedWindow();
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
                        const window = BrowserWindow.getFocusedWindow();
                        if (window) {
                            window.webContents.send("save-file-as");
                        }
                    },
                },
                isMac ? {role: "close"} : {role: "quit"},
            ],
        },
        // { role: 'viewMenu' }
        {
            label: "View",
            submenu: [
                {role: "resetZoom"},
                {role: "zoomIn"},
                {role: "zoomOut"},
                {type: "separator"},
                {role: "togglefullscreen"},
            ],
        },
        // { role: 'windowMenu' }
        {
            label: "Window",
            submenu: [
                {role: "minimize"},
                ...(isMac
                    ? [
                          {type: "separator"},
                          {role: "front"},
                          {type: "separator"},
                          {role: "window"},
                      ]
                    : [{role: "close"}]),
            ],
        },
        {
            role: "help",
            submenu: [
                {
                    label: "Learn More",
                    click: async () => {
                        /* eslint-disable global-require */
                        const {shell} = require("electron");
                        await shell.openExternal(
                            "https://equinor.github.io/webviz-subsurface"
                        );
                    },
                },
                {
                    label: "Report a bug",
                    click: async () => {
                        /* eslint-disable global-require */
                        const {shell} = require("electron");
                        await shell.openExternal(
                            "https://github.com/equinor/webviz-config-editor/issues"
                        );
                    },
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
                                  browserWindow.webContents.send(
                                      "debug:reset-init"
                                  );
                              },
                          },
                          {
                                label: "Open Preview",
                                click(_: any, browserWindow: BrowserWindow) {
                                    createPreviewWindow();
                                },
                          } 
                      ],
                  },
              ]
            : []),
    ];

    const menu = Menu.buildFromTemplate(
        template as Array<MenuItemConstructorOptions>
    );
    Menu.setApplicationMenu(menu);
};
