"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentFiles = exports.RecentFilesManager = void 0;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
class RecentFilesManager {
    constructor() {
        this.recentFiles = [];
    }
    setRecentFiles(files) {
        this.recentFiles = files;
    }
    getRecentFiles() {
        return this.recentFiles.filter((el) => fs_1.default.existsSync(el));
    }
    static clearRecentFiles() {
        const window = electron_1.BrowserWindow.getFocusedWindow();
        if (window) {
            window.webContents.send("clear-recent-files");
        }
    }
}
exports.RecentFilesManager = RecentFilesManager;
exports.RecentFiles = new RecentFilesManager();
//# sourceMappingURL=recent-files.js.map