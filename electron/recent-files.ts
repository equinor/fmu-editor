import {BrowserWindow} from "electron";

import fs from "fs";

export class RecentFilesManager {
    private recentFiles: string[];
    constructor() {
        this.recentFiles = [];
    }

    setRecentFiles(files: string[]) {
        this.recentFiles = files;
    }

    getRecentFiles(): string[] {
        return this.recentFiles.filter((el: string) => fs.existsSync(el));
    }

    static clearRecentFiles() {
        const window = BrowserWindow.getFocusedWindow();
        if (window) {
            window.webContents.send("clear-recent-files");
        }
    }
}

export const RecentFiles = new RecentFilesManager();
