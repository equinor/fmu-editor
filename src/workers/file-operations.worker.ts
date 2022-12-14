import {FileChangeType} from "@shared-types/file-changes";
import {
    ChangedFile,
    FileOperationsRequestType,
    FileOperationsRequests,
    FileOperationsResponseType,
    FileOperationsResponses,
    FileOperationsStatus,
} from "@shared-types/file-operations";

import fs from "fs";
import path from "path";

import {Webworker} from "./worker-utils";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<FileOperationsResponses, FileOperationsRequests>({self});

let currentUsername: string = "";
let currrentDirectory: string = "";

const countFilesInDirectory = (directory: string, mtime: Date): number => {
    const files = fs.readdirSync(directory).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
    let count = 0;

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            count += countFilesInDirectory(filePath, mtime);
        } else if (stats.isFile() && stats.mtime > mtime) {
            count++;
        }
    });

    return count;
};

function copyFilesRecursively(source: string, destination: string, callback: () => void, lastUpdated: Date): string[] {
    const files = fs.readdirSync(source).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
    const mergeFiles: string[] = [];
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destinationPath = path.join(destination, file);
        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath, {recursive: true});
            }
            mergeFiles.push(...copyFilesRecursively(sourcePath, destinationPath, callback, lastUpdated));
        } else {
            if (!fs.existsSync(destinationPath)) {
                fs.copyFileSync(sourcePath, destinationPath);
                fs.utimesSync(destinationPath, new Date(), stats.mtime);
            } else if (stats.mtime > lastUpdated) {
                mergeFiles.push(sourcePath);
            }
            callback();
        }
    });
    return mergeFiles;
}

type FileMap = {
    origin: "user" | "original";
    file: string;
};

const deduplicate = (fileMap: FileMap[]): FileMap[] => {
    return fileMap.filter(el => {
        if (el.origin === "original" && fileMap.some(el2 => el2.origin === "user" && el2.file === el.file)) {
            return false;
        }
        return true;
    });
};

function checkFilesRecursively(source: string, destination: string, lastUpdated: Date): ChangedFile[] {
    const changedFiles: ChangedFile[] = [];

    const sourceFiles = fs.readdirSync(source).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
    const destinationFiles = [];

    if (fs.existsSync(destination)) {
        destinationFiles.push(...fs.readdirSync(destination).filter(item => !/(^|\/)\.[^\/\.]/g.test(item)));
    }

    const combinedDirContent = deduplicate([
        ...sourceFiles.map(el => ({origin: "original", file: el})),
        ...destinationFiles.map(el => ({origin: "user", file: el})),
    ] as FileMap[]);

    combinedDirContent.forEach(file => {
        const sourcePath = path.join(source, file.file);
        const destinationPath = path.join(destination, file.file);
        const stats = fs.statSync(sourcePath);
        if (stats.isDirectory()) {
            changedFiles.push(...checkFilesRecursively(sourcePath, destinationPath, lastUpdated));
        } else if (!fs.existsSync(destinationPath)) {
            changedFiles.push({filePath: sourcePath, mergingRequired: false, type: FileChangeType.ADDED});
        } else {
            const destinationStats = fs.statSync(destinationPath);
            if (stats.mtime > lastUpdated) {
                changedFiles.push({
                    filePath: sourcePath,
                    mergingRequired: destinationStats.mtime > lastUpdated,
                    type: FileChangeType.MODIFIED,
                });
            }
        }
    });
    return changedFiles;
}

const readCacheFile = (directory: string): Date => {
    const cacheFile = path.join(directory, ".cache");
    let lastUpdated: Date = new Date(0);
    if (fs.existsSync(cacheFile)) {
        const cacheData = JSON.parse(fs.readFileSync(cacheFile).toString());
        lastUpdated = new Date(parseInt(cacheData.lastUpdated, 10));
    }
    return lastUpdated;
};

const updateCacheFile = (directory: string): void => {
    const cacheFile = path.join(directory, ".cache");
    const cache = {
        lastUpdated: Date.now().toString(),
    };
    fs.writeFileSync(cacheFile, JSON.stringify(cache), {encoding: "utf-8"});
};

const copyToUserDirectory = (directory: string, user: string): string[] => {
    const userDirectory = path.join(directory, ".users", user);
    if (!fs.existsSync(userDirectory)) {
        fs.mkdirSync(userDirectory, {recursive: true});
    }

    const lastUpdated = readCacheFile(userDirectory);
    updateCacheFile(userDirectory);

    const totalNumFiles = countFilesInDirectory(directory, lastUpdated);

    let currentFile = 0;

    const callback = () => {
        currentFile++;
        webworker.postMessage(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, {
            progress: currentFile / totalNumFiles,
            status: FileOperationsStatus.IN_PROGRESS,
        });
    };

    return copyFilesRecursively(directory, userDirectory, callback, lastUpdated);
};

const checkForFileChanges = (directory: string, user: string): ChangedFile[] => {
    const userDirectory = path.join(directory, ".users", user);
    const lastUpdated = readCacheFile(userDirectory);

    return checkFilesRecursively(directory, userDirectory, lastUpdated);
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(() => {
    if (currentUsername && currrentDirectory) {
        const files = checkForFileChanges(currrentDirectory, currentUsername);
        if (files.length > 0) {
            webworker.postMessage(FileOperationsResponseType.CHANGED_FILES, {
                changedFiles: files,
            });
        }
    }
}, 5000);

webworker.on(FileOperationsRequestType.COPY_USER_DIRECTORY, ({directory, username}) => {
    copyToUserDirectory(directory, username);
});

webworker.on(FileOperationsRequestType.SET_USER_DIRECTORY, ({directory, username}) => {
    currentUsername = username;
    currrentDirectory = directory;
});
