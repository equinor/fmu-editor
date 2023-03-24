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

let currentWorkingDirectoryPath: string | null = null;
let interval: ReturnType<typeof setInterval> | null = null;
let oldData: string | null = null;

const checkForFileChanges = () => {
    if (!currentWorkingDirectoryPath) {
        return;
    }

    let fileChanges: FileChange[] = [];

    const workingDirectory = new WorkingDirectory("./", currentWorkingDirectoryPath);

    if (workingDirectory.exists()) {
        workingDirectory.getUsers().forEach(user => {
            fileChanges = [...fileChanges, ...compareDirectories(currentWorkingDirectoryPath, user)];
        });
    }

    if (oldData === JSON.stringify(fileChanges)) {
        return;
    }
    oldData = JSON.stringify(fileChanges);

    // eslint-disable-next-line no-restricted-globals
    webworker.postMessage(FileChangesWatcherResponseType.FILE_CHANGES, {fileChanges});
};

webworker.on(FileChangesWatcherRequestType.SET_WORKING_DIRECTORY_PATH, ({workingDirectoryPath}) => {
    currentWorkingDirectoryPath = workingDirectoryPath;

    if (interval) {
        clearInterval(interval);
    }
    checkForFileChanges();

    interval = setInterval(checkForFileChanges, 3000);
});
