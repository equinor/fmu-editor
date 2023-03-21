import fs from "fs-extra";
import path from "path";

import { DIRECTORY_PATHS } from "@global/constants";

export interface IFileBasic {
    exists(): boolean;
    workingDirectoryPath(): string;
    relativePath(): string;
    absolutePath(): string;
    userPath(user: string): string;
    modifiedTime(): number | null;
    remove(): boolean;
    getUserVersion(user: string): FileBasic;
    getMainVersion(user: string): FileBasic;
    isUserFile(): boolean;
    isDirectory(): boolean;
    clone(): FileBasic;
    error(): unknown | null;
    toObject(): {[key: string]: string};
    equals(other: FileBasic): boolean;
    isWritable(): boolean;
    baseName(): string;
    isSnapshotFile(): boolean;
    getSnapshotVersion(snapshot: string): FileBasic;
    rename(newName: string): boolean;
}

export class FileBasic implements IFileBasic {
    protected _path: string;
    protected _workingDirectoryPath: string;
    protected _modified: number;
    protected _created: number;
    protected _error: unknown | null;

    constructor(relativeFilePath: string, workingDirectoryPath: string) {
        this._path = relativeFilePath;
        this._workingDirectoryPath = workingDirectoryPath;
        this._modified = 0;
        this._created = 0;
        this._error = null;
    }

    public relativePath(): string {
        return this._path;
    }

    public exists(): boolean {
        return fs.existsSync(this.absolutePath());
    }

    public rename(newName: string): boolean {
        const newPath = path.join(path.dirname(this.absolutePath()), newName);
        if (fs.existsSync(newPath)) {
            return false;
        }
        try {
            fs.renameSync(this.absolutePath(), newPath);
            this._path = path.relative(this._workingDirectoryPath, newPath);
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public workingDirectoryPath(): string {
        return this._workingDirectoryPath;
    }

    public baseName(): string {
        return path.basename(this.absolutePath());
    }

    public absolutePath(): string {
        return path.join(this.workingDirectoryPath(), this.relativePath());
    }

    public userPath(user: string): string {
        return path.join(this.workingDirectoryPath(), DIRECTORY_PATHS.USERS, user, this.relativePath());
    }

    public getUserVersion(user: string): this {
        if (this.isUserFile()) {
            return this;
        }
        if (this.isSnapshotFile()) {
            return new (this.constructor as new (relativeFilePath: string, workingDirectoryPath: string) => typeof this)(
                path.join(DIRECTORY_PATHS.USERS, user, this.getMainVersion().relativePath()),
                this.workingDirectoryPath()
            );
        }
        return new (this.constructor as new (relativeFilePath: string, workingDirectoryPath: string) => typeof this)(
            path.join(DIRECTORY_PATHS.USERS, user, this.relativePath()),
            this.workingDirectoryPath()
        );
    }

    public getSnapshotVersion(snapshot: string): this {
        if (this.isUserFile()) {
            return new (this.constructor as new (relativeFilePath: string, workingDirectoryPath: string) => typeof this)(
                path.join(DIRECTORY_PATHS.SNAPSHOTS, snapshot, this.getMainVersion().relativePath()),
                this.workingDirectoryPath()
            );
        }
        if (this.isSnapshotFile()) {
            return this;
        }
        return new (this.constructor as new (relativeFilePath: string, workingDirectoryPath: string) => typeof this)(
            path.join(DIRECTORY_PATHS.SNAPSHOTS, snapshot, this.relativePath()),
            this.workingDirectoryPath()
        );
    }

    public getMainVersion(): this {
        if (this.isUserFile() || this.isSnapshotFile()) {
            return new (this.constructor as new (relativeFilePath: string, workingDirectoryPath: string) => typeof this)(
                this.relativePath().split(path.sep).slice(2).join(path.sep),
                this.workingDirectoryPath()
            );
        }
        return this;
    }

    public modifiedTime(): number | null {
        try {
            return fs.statSync(this.absolutePath()).mtime.getTime();
        } catch (e) {
            this._error = e;
            return null;
        }
    }

    public isUserFile(): boolean {
        return this.relativePath().split(path.sep).at(0) === DIRECTORY_PATHS.USERS;
    }

    public isSnapshotFile(): boolean {
        return this.relativePath().split(path.sep).at(0) === DIRECTORY_PATHS.SNAPSHOTS;
    }

    protected usersDir(): string {
        return path.join(this.workingDirectoryPath(), DIRECTORY_PATHS.USERS);
    }

    protected snapshotsDir(): string {
        return path.join(this.workingDirectoryPath(), DIRECTORY_PATHS.SNAPSHOTS);
    }

    protected extractUserFromPath(userPath: string): string {
        const parts = path.relative(this.workingDirectoryPath(), userPath).split(path.sep);
        if (parts.at(0) === DIRECTORY_PATHS.USERS && parts.length > 2) {
            return parts.at(1);
        }
        return "";
    }

    public remove(): boolean {
        try {
            if (this.isDirectory()) {
                fs.rmdirSync(this.absolutePath());
                return true;
            }
            fs.unlinkSync(this.absolutePath());
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public moveToDir(dirPath: string): boolean {
        try {
            const newPath = path.join(dirPath, this.baseName());
            fs.moveSync(this.absolutePath(), newPath);
            this._path = path.relative(this._workingDirectoryPath, newPath);
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public parentDirectoryPath(): string {
        return path.dirname(this.absolutePath());
    }

    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    public isDirectory(): boolean {
        try {
            return fs.statSync(this.absolutePath()).isDirectory();
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public error(): unknown | null {
        return this._error;
    }

    public clone(): FileBasic {
        return new FileBasic(this.relativePath(), this.workingDirectoryPath());
    }

    public toObject(): {[key: string]: string} {
        return {
            path: this.relativePath(),
            workingDirectory: this.workingDirectoryPath(),
        };
    }

    public static fromObject(obj: {[key: string]: string}): FileBasic {
        return new (this.constructor as new (relativeFilePath: string, workingDirectory: string) => FileBasic)(
            obj.path,
            obj.workingDirectory
        );
    }

    public equals(other: FileBasic, ignoreUserPath = false): boolean {
        if (ignoreUserPath) {
            return (
                this.getMainVersion().relativePath() === other.getMainVersion().relativePath() &&
                this.workingDirectoryPath() === other.workingDirectoryPath()
            );
        }
        return this.relativePath() === other.relativePath() && this.workingDirectoryPath() === other.workingDirectoryPath();
    }

    public isWritable(): boolean {
        try {
            fs.accessSync(this.absolutePath(), fs.constants.W_OK);
            return true;
        } catch (e) {
            return false;
        }
    }
}
