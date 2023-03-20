import { app } from "electron";

export function isDev() {
    return !app.isPackaged;
}
