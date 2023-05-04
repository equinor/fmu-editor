import {DIRECTORY_PATHS, SYSTEM_FILES} from "@global/constants";

import path from "path";

import {Directory} from "./directory";
import {File} from "./file";

export interface ISyncSnapshot {}

interface ISyncSnapshotFile {
    modified: number;
    snapshot: ISyncSnapshotTree;
}

interface ISyncSnapshotTree {
    [key: string]: number;
}

export class SyncSnapshot implements ISyncSnapshot {
    private snapshotFile: File;
    private modified: number;
    private snapshot: ISyncSnapshotTree;

    constructor(workingDirectory: string, user: string) {
        this.snapshotFile = new File(
            path.join(DIRECTORY_PATHS.USERS, user, SYSTEM_FILES.SYNC_SNAPSHOT),
            workingDirectory
        );
        this.modified = 0;
        this.snapshot = {};
        this.read();
    }

    public make(): void {
        this.snapshot = {};
        const folder = new Directory("", this.snapshotFile.workingDirectoryPath());
        folder.getFilesRecursively().forEach(file => {
            this.snapshot[file.relativePath()] = file.modifiedTime();
        });
        this.write();
    }

    public exists(): boolean {
        return this.snapshotFile.exists();
    }

    private write(): void {
        const snapshot: ISyncSnapshotFile = {
            modified: new Date().getTime(),
            snapshot: this.snapshot,
        };
        this.snapshotFile.writeJson(snapshot);
    }

    private read(): void {
        const snapshot = this.snapshotFile.readJson();
        if (snapshot) {
            this.modified = snapshot.modified;
            this.snapshot = snapshot.snapshot;
        }
    }

    private maybeRead(): void {
        if (this.snapshotFile.modifiedTime() > this.modified) {
            this.read();
        }
    }

    public fileExists(relativeFilePath: string): boolean {
        this.maybeRead();
        return Boolean(this.snapshot[relativeFilePath]);
    }

    public getModifiedMs(relativeFilePath: string): number | null {
        this.maybeRead();
        return this.snapshot[relativeFilePath] || null;
    }

    public updateModified(relativeFilePath: string): void {
        this.snapshot[relativeFilePath] = new Date().getTime();
        this.write();
    }

    public delete(relativeFilePath: string): void {
        delete this.snapshot[relativeFilePath];
        this.write();
    }
}
