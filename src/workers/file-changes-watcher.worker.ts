import {FileManager} from "@utils/file-manager";
import {compareDirectories} from "@utils/file-system/operations";
import {WorkingDirectory} from "@utils/file-system/working-directory";

import {
    FileChange,
    FileChangesRequests,
    FileChangesResponses,
    FileChangesWatcherRequestType,
    FileChangesWatcherResponseType,
} from "@shared-types/file-changes";

import {Webworker} from "./worker-utils";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<FileChangesResponses, FileChangesRequests>({self});
const fileManager = new FileManager();

let currentDirectory: string | null = null;

const checkForFileChanges = () => {
    if (!currentDirectory) {
        return;
    }

    let fileChanges: FileChange[] = [];

    const workingDirectory = new WorkingDirectory("./", currentDirectory);

    if (workingDirectory.exists()) {
        workingDirectory.getUsers().forEach(user => {
            fileChanges = [...fileChanges, ...compareDirectories(currentDirectory, user)];
        });
    }

    // eslint-disable-next-line no-restricted-globals
    webworker.postMessage(FileChangesWatcherResponseType.FILE_CHANGES, {fileChanges});
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(checkForFileChanges, 3000);

webworker.on(FileChangesWatcherRequestType.SET_DIRECTORY, ({directory}) => {
    currentDirectory = directory;
    fileManager.setCurrentDirectory(directory);
});
