import {BrowserWindow, Menu, MenuItemConstructorOptions} from "electron";

import {isDev} from "./env";

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

    if (isDev()) {
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

    let template = [
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
        ...(isDev()
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
                              click() {
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
