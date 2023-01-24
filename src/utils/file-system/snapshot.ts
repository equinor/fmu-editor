import path from "path";

import {Directory} from "./directory";
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
    private snapshot: ISnapshotTree;

    constructor(workingDirectory: string, user: string) {
        this.snapshotFile = new File(path.join(".users", user, ".snapshot"), workingDirectory);
        this.modified = 0;
        this.snapshot = {};
        this.read();
    }

    public make(): void {
        this.snapshot = {};
        const folder = new Directory("", this.snapshotFile.workingDirectory());
        folder.getFilesRecursively().forEach(file => {
            this.snapshot[file.relativePath()] = file.modifiedTime();
        });
        this.write();
    }

    public exists(): boolean {
        return this.snapshotFile.exists();
    }

    private write(): void {
        const snapshot: ISnapshotFile = {
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
