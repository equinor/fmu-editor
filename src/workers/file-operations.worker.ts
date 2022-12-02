import {
    FileOperationsRequestType,
    FileOperationsResponseType,
    FileOperationsResponses,
    FileOperationsStatus,
} from "@shared-types/file-operations";

import fs from "fs";
import path from "path";

const countFilesInDirectory = (directory: string): number => {
    const files = fs.readdirSync(directory).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
    let count = 0;

    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            count += countFilesInDirectory(filePath);
        } else {
            count++;
        }
    });

    return count;
};

function copyFilesRecursively(source: string, destination: string, callback: () => void): void {
    const files = fs.readdirSync(source).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
    files.forEach(file =>
        setTimeout(() => {
            const sourcePath = path.join(source, file);
            const destinationPath = path.join(destination, file);
            const stats = fs.statSync(sourcePath);
            if (stats.isDirectory()) {
                fs.mkdirSync(destinationPath);
                setTimeout(() => copyFilesRecursively(sourcePath, destinationPath, callback), 1000);
            } else {
                fs.copyFileSync(sourcePath, destinationPath);
                callback();
            }
        }, 1000)
    );
}

const copyToUserDirectory = (directory: string, user: string): void => {
    const userDirectory = path.join(directory, ".users", user);
    if (!fs.existsSync(userDirectory)) {
        fs.mkdirSync(userDirectory, {recursive: true});
    }
    const totalNumFiles = countFilesInDirectory(directory);

    let currentFile = 0;

    const callback = () => {
        currentFile++;
        const response: FileOperationsResponses = {
            type: FileOperationsResponseType.COPY_USER_DIRECTORY_PROGRESS,
            payload: {
                progress: currentFile / totalNumFiles,
                status: FileOperationsStatus.IN_PROGRESS,
            },
        };
        // eslint-disable-next-line no-restricted-globals
        self.postMessage(response);
    };

    copyFilesRecursively(directory, userDirectory, callback);
};

// eslint-disable-next-line no-restricted-globals
self.addEventListener("message", event => {
    switch (event.data.type) {
        case FileOperationsRequestType.COPY_USER_DIRECTORY:
            copyToUserDirectory(event.data.payload.directory, event.data.payload.username);
            break;
        default:
    }
});
