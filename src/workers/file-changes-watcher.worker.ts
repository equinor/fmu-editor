import {readFileTree} from "@utils/file-operations";

import {
    FileChange,
    FileChangesRequests,
    FileChangesResponses,
    FileChangesWatcherRequestType,
    FileChangesWatcherResponseType,
} from "@shared-types/file-changes";
import {FileTree, FileTreeItem} from "@shared-types/file-tree";

import fs from "fs";
import path from "path";

import {Webworker} from "./worker-utils";

const webworker = new Webworker<FileChangesResponses, FileChangesRequests>();

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

    let fileChanges: FileChange[] = [];

    const userDirectory = path.join(currentDirectory, ".users");
    if (!fs.existsSync(userDirectory)) {
        const userFolders = fs.readdirSync(userDirectory);

        userFolders.forEach(userFolder => {
            const userPath = path.join(userDirectory, userFolder);
            const userContent = readFileTree(userPath);

            fileChanges = [...fileChanges, ...flattenFileTree(userFolder, userContent)];
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
