import {readFileTree} from "@utils/file-operations";

import {FileChange, FileChangesWatcherRequest, FileChangesWatcherResponse} from "@shared-types/file-changes";
import {FileTree, FileTreeItem} from "@shared-types/file-tree";

import fs from "fs";
import path from "path";

let currentDirectory: string | null = null;

const flattenFileTree = (userFolder: string, fileTree: FileTree): FileChange[] => {
    const fileChanges: FileChange[] = [];
    fileTree.forEach((file: FileTreeItem) => {
        if (file.type === "directory" && file.children) {
            fileChanges.push(...flattenFileTree(userFolder, file.children));
        } else {
            fileChanges.push({
                user: userFolder,
                filePath: file.path,
                modified: file.modified,
            });
        }
    });
    return fileChanges;
};

const checkForFileChanges = () => {
    if (!currentDirectory) {
        return;
    }

    const userDirectory = path.join(currentDirectory, ".users");
    if (!fs.existsSync(userDirectory)) {
        return;
    }
    const userFolders = fs.readdirSync(userDirectory);

    let fileChanges: FileChange[] = [];

    userFolders.forEach(userFolder => {
        const userPath = path.join(userDirectory, userFolder);
        const userContent = readFileTree(userPath);

        fileChanges = [...fileChanges, ...flattenFileTree(userFolder, userContent)];
    });

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({type: FileChangesWatcherResponse.FILE_CHANGES, fileChanges});
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(checkForFileChanges, 3000);

// eslint-disable-next-line no-restricted-globals
self.addEventListener("message", event => {
    switch (event.data.type) {
        case FileChangesWatcherRequest.SET_DIRECTORY:
            currentDirectory = event.data.directory;
            break;
        default:
    }
});
