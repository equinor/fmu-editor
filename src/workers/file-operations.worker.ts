import {Changelog} from "@utils/file-system/changelog";
import {Directory} from "@utils/file-system/directory";
import {File} from "@utils/file-system/file";
import {pullFiles, pushFiles} from "@utils/file-system/operations";
import {SyncSnapshot} from "@utils/file-system/snapshot";

import {
    FileOperationsRequestType,
    FileOperationsRequests,
    FileOperationsResponseType,
    FileOperationsResponses,
    FileOperationsStatus,
} from "@shared-types/file-operations";

import { DIRECTORY_PATHS } from "@global/constants";

import path from "path";

import {Webworker} from "./worker-utils";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<FileOperationsResponses, FileOperationsRequests>({self});

let currentUsername: string = "";
let currentWorkingDirectoryPath: string = "";

const copyToUserDirectory = (workingDirectoryPath: string, user: string): void => {
    const userDirectoryPath = path.join(DIRECTORY_PATHS.USERS, user);
    const mainDirectory = new Directory("", workingDirectoryPath);
    const userDirectory = new Directory(userDirectoryPath, workingDirectoryPath);

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

    try {
        mainDirectory.getContent(true).forEach(fileOrDir => {
            if (fileOrDir instanceof Directory) {
                fileOrDir.getUserVersion(user).makeIfNotExists();
            } else if (fileOrDir instanceof File) {
                (fileOrDir as unknown as File).copyTo(
                    path.join(userDirectory.absolutePath(), fileOrDir.relativePath())
                );
                callback();
            }
        });
    } catch (e) {
        webworker.postMessage(FileOperationsResponseType.USER_DIRECTORY_INITIALIZED, {
            success: false,
            errorMessage: e instanceof Error ? e.message : "Unknown error",
        });
    }
};

const maybeInitUserDirectory = (workingDirectoryPath: string, user: string): void => {
    const workingDirectory = new Directory("", currentWorkingDirectoryPath);
    if (!workingDirectory.exists()) {
        return;
    }

    const userDirectoryPath = path.join(DIRECTORY_PATHS.USERS, user);
    const userDirectory = new Directory(userDirectoryPath, workingDirectoryPath);

    if (!userDirectory.exists() || userDirectory.isEmpty()) {
        copyToUserDirectory(workingDirectoryPath, user);
    }

    const snapshot = new SyncSnapshot(workingDirectoryPath, user);
    if (!snapshot.exists()) {
        snapshot.make();
    }

    webworker.postMessage(FileOperationsResponseType.USER_DIRECTORY_INITIALIZED, {
        success: true,
    });
};

const ensureUserDirectoryExists = (): void => {
    if (!currentUsername || !currentWorkingDirectoryPath) {
        return;
    }

    maybeInitUserDirectory(currentWorkingDirectoryPath, currentUsername);
};

// eslint-disable-next-line no-restricted-globals
self.setInterval(ensureUserDirectoryExists, 3000);

webworker.on(FileOperationsRequestType.SET_USER_DIRECTORY, ({directory, username}) => {
    currentUsername = username;
    currentWorkingDirectoryPath = directory;
    maybeInitUserDirectory(directory, username);
});

webworker.on(FileOperationsRequestType.PUSH_USER_CHANGES, ({fileChanges, commitSummary, commitDescription}) => {
    if (currentUsername && currentWorkingDirectoryPath) {
        const {pushedFilesPaths, notPushedFilesPaths, commit} = pushFiles(
            fileChanges,
            currentUsername,
            commitSummary,
            commitDescription,
            currentWorkingDirectoryPath
        );

        let commitMessageWritten = false;
        if (fileChanges.length > notPushedFilesPaths.length) {
            const changelog = new Changelog(currentWorkingDirectoryPath);
            commitMessageWritten = changelog.appendCommit(commit);
        }

        webworker.postMessage(FileOperationsResponseType.USER_CHANGES_PUSHED, {
            pushedFilesPaths,
            commitMessageWritten,
            notPushedFilesPaths,
        });
    }
});

webworker.on(FileOperationsRequestType.PULL_MAIN_CHANGES, ({fileChanges}) => {
    if (currentUsername && currentWorkingDirectoryPath) {
        const workingDirectory = new Directory("", currentWorkingDirectoryPath);
        if (!workingDirectory.exists()) {
            return;
        }

        const {pulledFilesPaths, notPulledFilesPaths} = pullFiles(
            fileChanges,
            currentUsername,
            currentWorkingDirectoryPath
        );

        webworker.postMessage(FileOperationsResponseType.MAIN_CHANGES_PULLED, {
            pulledFilesPaths,
            notPulledFilesPaths,
            success: notPulledFilesPaths.length < fileChanges.length,
        });
    }
});
