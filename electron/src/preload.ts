import {IpcDebugMessages, IpcMessages} from "@shared-types/ipc";

const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electron", {
    getAppData: () => {
        ipcRenderer.send(IpcMessages.GET_APP_DATA);
    },
    disableSaveActions: () => {
        ipcRenderer.send(IpcMessages.DISABLE_SAVE_ACTIONS);
    },
    enableSaveActions: () => {
        ipcRenderer.send(IpcMessages.ENABLE_SAVE_ACTIONS);
    },
    saveFileAs: () => {
        ipcRenderer.send(IpcMessages.SAVE_FILE_AS);
    },
    selectFile: () => {
        ipcRenderer.send(IpcMessages.SELECT_FILE);
    },
    handleNewFile: (func: () => void) => {
        ipcRenderer.on(IpcMessages.NEW_FILE, () => func());
    },
    handleSaveFile: (func: () => void) => {
        ipcRenderer.on(IpcMessages.SAVE_FILE, () => func());
    },
    handleError: (func: (error: string) => void) => {
        ipcRenderer.on(IpcMessages.ERROR, (_, error) => func(error));
    },
    handleDebugReset: (func: () => void) => {
        ipcRenderer.on(IpcDebugMessages.RESET, () => func());
    },
});
