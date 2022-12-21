import {FileChange, FileChangeType} from "@shared-types/file-changes";

import {Directory} from "./directory";
import {File} from "./file";
import {Snapshot} from "./snapshot";

export type FileMap = {
    file: File;
    origin: "main" | "user";
};

const deduplicate = (fileMap: FileMap[]): FileMap[] => {
    return fileMap.filter(el => {
        if (el.origin === "user" && fileMap.some(el2 => el2.origin === "main" && el2.file.equals(el.file, true))) {
            return false;
        }
        return true;
    });
};

export const compareDirectories = (workingDirectory: string, user: string): FileChange[] => {
    const changes: FileChange[] = [];
    const snapshot = new Snapshot(workingDirectory, user);
    const mainDirectory = new Directory("./", workingDirectory);
    const userDirectory = mainDirectory.getUserVersion(user) as Directory;

    const mainFiles = mainDirectory.getFilesRecursively();
    const userFiles = userDirectory.getFilesRecursively();

    const combinedFiles = deduplicate([
        ...mainFiles.map(el => ({file: el, origin: "main"})),
        ...userFiles.map(el => ({file: el, origin: "user"})),
    ] as FileMap[]);

    combinedFiles.forEach(({origin, file}) => {
        if (origin === "main") {
            const userFile = file.getUserVersion(user) as File;
            if (userFile.exists()) {
                if (userFile.modifiedTime() < file.modifiedTime() && !userFile.compare(file)) {
                    changes.push({
                        type: FileChangeType.MODIFIED,
                        relativePath: file.relativePath(),
                        main: true,
                        user,
                        modified: file.modifiedTime(),
                    });
                } else if (userFile.modifiedTime() > file.modifiedTime() && !userFile.compare(file)) {
                    changes.push({
                        type: FileChangeType.MODIFIED,
                        relativePath: file.relativePath(),
                        user,
                        main: false,
                        modified: userFile.modifiedTime(),
                    });
                }
            } else if (snapshot.fileExists(file.relativePath())) {
                changes.push({
                    type: FileChangeType.DELETED,
                    relativePath: file.relativePath(),
                    main: false,
                    user,
                });
            } else {
                changes.push({
                    type: FileChangeType.ADDED,
                    relativePath: file.relativePath(),
                    main: true,
                    user,
                });
            }
        } else {
            const mainFile = file.getMainVersion() as File;
            if (mainFile.exists()) {
                if (mainFile.modifiedTime() < file.modifiedTime() && !mainFile.compare(file)) {
                    changes.push({
                        type: FileChangeType.MODIFIED,
                        relativePath: file.relativePath(),
                        main: false,
                        user,
                        modified: file.modifiedTime(),
                    });
                } else if (mainFile.modifiedTime() > file.modifiedTime() && !mainFile.compare(file)) {
                    changes.push({
                        type: FileChangeType.MODIFIED,
                        relativePath: file.relativePath(),
                        main: true,
                        user,
                        modified: mainFile.modifiedTime(),
                    });
                }
            } else if (snapshot.fileExists(file.relativePath())) {
                changes.push({
                    type: FileChangeType.DELETED,
                    relativePath: file.relativePath(),
                    main: true,
                    user,
                });
            } else {
                changes.push({
                    type: FileChangeType.ADDED,
                    relativePath: file.relativePath(),
                    main: false,
                    user,
                });
            }
        }
    });

    return changes;
};
