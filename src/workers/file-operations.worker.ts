import {FileManager} from "@utils/file-manager";

import {
    FileOperationsRequestType,
    FileOperationsRequests,
    FileOperationsResponseType,
    FileOperationsResponses,
    FileOperationsStatus,
} from "@shared-types/file-operations";

import fs from "fs";
import path from "path";

import {Webworker} from "./worker-utils";
import { Snapshot } from "@utils/file-system/snapshot";

// eslint-disable-next-line no-restricted-globals
const webworker = new Webworker<FileOperationsResponses, FileOperationsRequests>({self});

const fileManager = new FileManager();

let currentUsername: string = "";
let currrentDirectory: string = "";

const countFilesInDirectory = (directory: string): number => {
    const files = fs.readdirSync(directory).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
    let count = 0;

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            count += countFilesInDirectory(filePath);
        } else if (stats.isFile()) {
            count++;
        }
    });

    return count;
};

function copyFilesRecursively(source: string, destination: string, callback: () => void): string[] {
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
            mergeFiles.push(...copyFilesRecursively(sourcePath, destinationPath, callback));
        } else {
            if (!fs.existsSync(destinationPath)) {
                fs.copyFileSync(sourcePath, destinationPath);
                fs.utimesSync(destinationPath, new Date(), stats.mtime);
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

const copyToUserDirectory = (directory: string, user: string): string[] => {
    const userDirectory = path.join(directory, ".users", user);
    if (!fs.existsSync(userDirectory)) {
        fs.mkdirSync(userDirectory, {recursive: true});
    }

    const totalNumFiles = countFilesInDirectory(directory);

    let currentFile = 0;

    const callback = () => {
        currentFile++;
        webworker.postMessage(FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS, {
            progress: currentFile / totalNumFiles,
            status: FileOperationsStatus.IN_PROGRESS,
        });
    };

    return copyFilesRecursively(directory, userDirectory, callback);
};

const maybeInitUserDirectory = (directory: string, user: string): void => {
    const userDirectory = path.join(directory, ".users", user);
    if (!fs.existsSync(userDirectory)) {
        copyToUserDirectory(directory, user);
    }

    const snapshot = new Snapshot(directory, user);
    if (!snapshot.exists()) {
        snapshot.make();
    }
};

webworker.on(FileOperationsRequestType.COPY_USER_DIRECTORY, ({directory, username}) => {
    copyToUserDirectory(directory, username);
    const snapshot = new Snapshot(directory, username);
    if (!snapshot.exists()) {
        snapshot.make();
    }
});

webworker.on(FileOperationsRequestType.SET_USER_DIRECTORY, ({directory, username}) => {
    currentUsername = username;
    currrentDirectory = directory;
    fileManager.setCurrentDirectory(directory);
    maybeInitUserDirectory(directory, username);
});
