"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppIcon = void 0;
const electron_1 = require("electron");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const RESOURCES_PATH = electron_1.app.isPackaged
    ? path_1.default.join(process.resourcesPath, "assets/icons")
    : path_1.default.join(__dirname, "../../assets/icons");
const getAssetPath = (...paths) => {
    return path_1.default.join(RESOURCES_PATH, ...paths);
};
const getAppIcon = () => {
    switch (os_1.default.platform()) {
        case "win32":
            return getAssetPath("win", "icon.ico");
        case "darwin":
            return getAssetPath("mac", "icon.icns");
        default:
            return getAssetPath("png", "1024x1024.png");
    }
};
exports.getAppIcon = getAppIcon;
//# sourceMappingURL=utils.js.map