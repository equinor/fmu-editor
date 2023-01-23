import {Changelog} from "@utils/file-system/changelog";
import {Directory} from "@utils/file-system/directory";
import {File} from "@utils/file-system/file";
import {pullFiles, pushFiles} from "@utils/file-system/operations";
import {Snapshot} from "@utils/file-system/snapshot";

import {
    FileOperationsRequestType,
    FileOperationsRequests,
    FileOperationsResponseType,
    FileOperationsResponses,
    FileOperationsStatus,
} from "@shared-types/file-operations";

import path from "path";

import {Webworker} from "./worker-utils";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<FileOperationsResponses, FileOperationsRequests>({self});

let currentUsername: string = "";
let currentWorkingDirectory: string = "";

const copyToUserDirectory = (directory: string, user: string): void => {
    const userDirectoryPath = path.join(".users", user);
    const mainDirectory = new Directory("", directory);
    const userDirectory = new Directory(userDirectoryPath, directory);

    userDirectory.makeIfNotExists();

    const totalNumFiles = mainDirectory.countFiles(true);

    let currentFile = 0;

    const callback = () => {
        currentFile++;
        webworker.postMessage(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, {
            progress: currentFile / totalNumFiles,
            status: FileOperationsStatus.IN_PROGRESS,
        });
    };

    mainDirectory.getContent(true).forEach(fileOrDir => {
        if (fileOrDir instanceof Directory) {
            fileOrDir.getUserVersion(user).makeIfNotExists();
        } else if (fileOrDir instanceof File) {
            (fileOrDir as unknown as File).copyTo(path.join(userDirectory.absolutePath(), fileOrDir.relativePath()));
        }
        callback();
    });
};

const maybeInitUserDirectory = (directory: string, user: string): void => {
    const userDirectoryPath = path.join(".users", user);
    const userDirectory = new Directory(userDirectoryPath, directory);

    if (!userDirectory.exists()) {
        copyToUserDirectory(directory, user);
    }

    const snapshot = new Snapshot(directory, user);
    if (!snapshot.exists()) {
        snapshot.make();
    }
};

const ensureUserDirectoryExists = (): void => {
    if (!currentUsername || !currentWorkingDirectory) {
        return;
    }

    maybeInitUserDirectory(currentWorkingDirectory, currentUsername);
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(ensureUserDirectoryExists, 3000);

webworker.on(FileOperationsRequestType.SET_USER_DIRECTORY, ({directory, username}) => {
    currentUsername = username;
    currentWorkingDirectory = directory;
    maybeInitUserDirectory(directory, username);
});

webworker.on(FileOperationsRequestType.PUSH_USER_CHANGES, ({fileChanges, commitSummary, commitDescription}) => {
    if (currentUsername && currentWorkingDirectory) {
        const {pushedFiles, notPushedFiles, commit} = pushFiles(
            fileChanges,
            currentUsername,
            commitSummary,
            commitDescription,
            currentWorkingDirectory
        );

        let commitMessageWritten = false;
        if (fileChanges.length > notPushedFiles.length) {
            const changelog = new Changelog(currentWorkingDirectory);
            commitMessageWritten = changelog.appendCommit(commit);
        }

        webworker.postMessage(FileOperationsResponseType.USER_CHANGES_PUSHED, {
            pushedFiles,
            commitMessageWritten,
            notPushedFiles,
        });
    }
});

webworker.on(FileOperationsRequestType.PULL_MAIN_CHANGES, ({fileChanges}) => {
    if (currentUsername && currentWorkingDirectory) {
        const {pulledFiles, notPulledFiles} = pullFiles(fileChanges, currentUsername, currentWorkingDirectory);

        webworker.postMessage(FileOperationsResponseType.MAIN_CHANGES_PULLED, {
            pulledFiles,
            notPulledFiles,
            success: notPulledFiles.length < fileChanges.length,
        });
    }
});
