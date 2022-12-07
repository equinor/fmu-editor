import {
    FileChange,
    FileChangeType,
    FileChangesRequests,
    FileChangesResponses,
    FileChangesWatcherRequestType,
    FileChangesWatcherResponseType,
} from "@shared-types/file-changes";
import {FileTree, FileTreeItem} from "@shared-types/file-tree";

import fs from "fs";
import path from "path";

import {Webworker} from "./worker-utils";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<FileChangesResponses, FileChangesRequests>({self});

let currentDirectory: string | null = null;

const flattenFileTree = (userFolder: string, fileTree: FileTree): FileChange[] => {
    const fileChanges: FileChange[] = [];
    fileTree.forEach((file: FileTreeItem) => {
        if (file.type === "directory" && file.children) {
            fileChanges.push(...flattenFileTree(userFolder, file.children));
        } else {
            fileChanges.push({
                user: userFolder,
                type: FileChangeType.MODIFIED,
                filePath: file.path,
                modified: file.modified,
            });
        }
    });
    return fileChanges;
};

const makeOriginalFilePath = (userFilePath: string, mainDirectory: string): string => {
    const relativePath = path.relative(mainDirectory, userFilePath);
    const [userDir, user, ...filePathParts] = relativePath.split(path.sep);
    return path.join(mainDirectory, ...filePathParts);
};

const makeUserFilePath = (userDirectory: string, filePath: string, mainDirectory: string): string => {
    const relativePath = path.relative(mainDirectory, filePath);
    const [...filePathParts] = relativePath.split(path.sep);
    return path.join(userDirectory, ...filePathParts);
};

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

const compareDirectory = (directory: string, user: string, mainDirectory: string): FileChange[] => {
    const fileChanges: FileChange[] = [];
    const originalDirectory = makeOriginalFilePath(directory, mainDirectory);
    const userDirContent = fs.readdirSync(directory).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
    const originalDirContent = [];
    if (fs.existsSync(originalDirectory)) {
        originalDirContent.push(...fs.readdirSync(originalDirectory).filter(item => !/(^|\/)\.[^\/\.]/g.test(item)));
    }

    const combinedDirContent = deduplicate([
        ...userDirContent.map(el => ({origin: "user", file: el})),
        ...originalDirContent.map(el => ({origin: "original", file: el})),
    ] as FileMap[]);

    combinedDirContent.forEach(file => {
        const filePath =
            file.origin === "user" ? path.join(directory, file.file) : path.join(originalDirectory, file.file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory() && file.origin === "user") {
            fileChanges.push(...compareDirectory(filePath, user, mainDirectory));
        } else if (stats.isFile()) {
            if (file.origin === "user") {
                const originalFilePath = makeOriginalFilePath(filePath, mainDirectory);
                if (fs.existsSync(originalFilePath)) {
                    const originalFileStats = fs.statSync(originalFilePath);
                    if (originalFileStats.size !== stats.size || originalFileStats.mtime < stats.mtime) {
                        fileChanges.push({
                            user,
                            type: FileChangeType.MODIFIED,
                            filePath,
                            modified: stats.mtime,
                        });
                    }
                } else {
                    fileChanges.push({
                        user,
                        type: FileChangeType.ADDED,
                        filePath,
                        modified: stats.mtime,
                    });
                }
            } else {
                const userFilePath = makeUserFilePath(directory, filePath, mainDirectory);
                fileChanges.push({
                    user,
                    type: FileChangeType.DELETED,
                    filePath: userFilePath,
                    modified: stats.mtime,
                });
            }
        }
    });
    return fileChanges;
};

const checkForFileChanges = () => {
    if (!currentDirectory) {
        return;
    }

    let fileChanges: FileChange[] = [];

    const userDirectory = path.join(currentDirectory, ".users");
    if (fs.existsSync(userDirectory)) {
        const userFolders = fs.readdirSync(userDirectory);
        userFolders.forEach(userFolder => {
            const userPath = path.join(userDirectory, userFolder);

            fileChanges = [...fileChanges, ...compareDirectory(userPath, userFolder, currentDirectory as string)];
        });
    }

    // eslint-disable-next-line no-restricted-globals
    webworker.postMessage(FileChangesWatcherResponseType.FILE_CHANGES, {fileChanges});
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(checkForFileChanges, 3000);

webworker.on(FileChangesWatcherRequestType.SET_DIRECTORY, ({directory}) => {
    currentDirectory = directory;
});
