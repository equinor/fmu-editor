import path from "path";

import {File} from "./file";

export interface ISnapshot {}

interface ISnapshotFile {
    modified: number;
    snapshot: ISnapshotTree;
}

interface ISnapshotTree {
    [key: string]: number;
}

export class Snapshot implements ISnapshot {
    private snapshotFile: File;
    private modified: number;
    private snapshotTree: ISnapshotTree;

    constructor(workingDirectory: string, user: string) {
        this.snapshotFile = new File(path.join(".users", user, ".snapshot"), workingDirectory);
        this.modified = 0;
        this.snapshotTree = {};
    }

    private write(): void {
        const snapshot: ISnapshotFile = {
            modified: new Date().getTime(),
            snapshot: this.snapshotTree,
        };
        this.snapshotFile.writeJson(snapshot);
    }

    private read(): void {
        const snapshot = this.snapshotFile.readJson();
        if (snapshot) {
            this.modified = snapshot.modified;
            this.snapshotTree = snapshot.snapshotTree;
        }
    }

    private maybeRead(): void {
        if (this.snapshotFile.modifiedTime() > this.modified) {
            this.read();
        }
    }

    public fileExists(relativeFilePath: string): boolean {
        this.maybeRead();
        return Boolean(this.snapshotTree[relativeFilePath]);
    }

    public getModifiedMs(relativeFilePath: string): number | null {
        this.maybeRead();
        return this.snapshotTree[relativeFilePath] || null;
    }

    public updateModified(relativeFilePath: string): void {
        this.snapshotTree[relativeFilePath] = new Date().getTime();
        this.write();
    }
}
