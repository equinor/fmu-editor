import path from "path";
import fs from "fs";

export interface IFileBasic {
    path(): string;
    exists(): boolean;
    workingDirectory(): string;
    relativePath(): string;
    userPath(user: string): string;
    modifiedTime(): number | null;
    remove(): boolean;
}

export class FileBasic implements IFileBasic {
    protected _path: string;
    protected _workingDirectory: string;
    protected _modified: number;
    protected _created: number;

    constructor(filePath: string, workingDirectory: string) {
        this._path = filePath;
        this._workingDirectory = workingDirectory;
        this._modified = 0;
        this._created = 0;
    }

    public path(): string {
        return this._path;
    }

    public exists(): boolean {
        return fs.existsSync(this.path());
    }

    public workingDirectory(): string {
        return this._workingDirectory;
    }

    public relativePath(): string {
        return path.relative(this.path(), this.workingDirectory());
    }

    public userPath(user: string): string {
        return path.join(this.workingDirectory(), ".users", user, this.relativePath());
    }

    public modifiedTime(): number | null {
        try {
            return fs.statSync(this.path()).mtimeMs;
        } catch (e) {
            return null;
        }
    }

    protected usersDir(): string {
        return path.join(this.workingDirectory(), ".users");
    }

    protected extractUserFromPath(userPath: string): string {
        const parts = path.relative(this.workingDirectory(), userPath).split(path.sep);
        if (parts.at(0) === ".users" && parts.length > 2) {
            return parts.at(1);
        }
        return "";
    }

    public remove(): boolean {
        try {
            fs.unlinkSync(this.path());
            return true;
        } catch (e) {
            return false;
        }
    }

    public isDirectory(): boolean {
        throw new Error("Not implemented");
    }
}
