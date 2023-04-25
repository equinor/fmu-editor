import {Directory} from "@utils/file-system/directory";
import {WorkingDirectory} from "@utils/file-system/working-directory";

import {
    FileSystemWatcherRequestType,
    FileSystemWatcherRequests,
    FileSystemWatcherResponseType,
    FileSystemWatcherResponses,
} from "@shared-types/file-system-watcher";

import {Webworker} from "./worker-utils";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<FileSystemWatcherResponses, FileSystemWatcherRequests>({self});

let currentFmuDirectory: string | null = null;
let currentDirectory: string | null = null;
let currentUsername: string | null = null;
let previousHash = "";
let previousFmuHash = "";

const watchFileSystem = () => {
    if (currentFmuDirectory) {
        const fmuDirectory = new Directory("", currentFmuDirectory);
        if (fmuDirectory.exists()) {
            const currentFmuHash = fmuDirectory.getHash(false);
            if (currentFmuHash === previousFmuHash) {
                return;
            }
            previousFmuHash = currentFmuHash;
            // eslint-disable-next-line no-restricted-globals
            webworker.postMessage(FileSystemWatcherResponseType.AVAILABLE_WORKING_DIRECTORIES_CHANGED, {});
        }
    }

    if (!currentDirectory || !currentUsername) {
        return;
    }

    const userWorkingDirectory = new WorkingDirectory("./", currentDirectory).getUserDirectory(currentUsername);

    if (userWorkingDirectory.exists()) {
        const currentHash = userWorkingDirectory.getHash();
        if (currentHash === previousHash) {
            return;
        }
        previousHash = currentHash;
        // eslint-disable-next-line no-restricted-globals
        webworker.postMessage(FileSystemWatcherResponseType.WORKING_DIRECTORY_CONTENT_CHANGED, {});
    }
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(watchFileSystem, 3000);

webworker.on(FileSystemWatcherRequestType.UPDATE_VALUES, ({username, workingDirectory, fmuDirectory}) => {
    currentDirectory = workingDirectory;
    currentUsername = username;
    currentFmuDirectory = fmuDirectory;
});
