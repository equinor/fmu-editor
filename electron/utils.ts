import {app} from "electron";

import os from "os";
import path from "path";

const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, "assets/icons")
    : path.join(__dirname, "../../assets/icons");

const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
};

export const getAppIcon = (): string => {
    switch (os.platform()) {
        case "win32":
            return getAssetPath("win", "icon.ico");
        case "darwin":
            return getAssetPath("mac", "icon.icns");
        default:
            return getAssetPath("png", "1024x1024.png");
    }
};
