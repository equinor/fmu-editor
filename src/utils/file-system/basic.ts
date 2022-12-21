import fs from "fs";
import path from "path";

export interface IFileBasic {
    exists(): boolean;
    workingDirectory(): string;
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
}

export class FileBasic implements IFileBasic {
    protected _path: string;
    protected _workingDirectory: string;
    protected _modified: number;
    protected _created: number;
    protected _error: unknown | null;

    constructor(relativeFilePath: string, workingDirectory: string) {
        this._path = relativeFilePath;
        this._workingDirectory = workingDirectory;
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

    public workingDirectory(): string {
        return this._workingDirectory;
    }

    public baseName(): string {
        return path.basename(this.absolutePath());
    }

    public absolutePath(): string {
        return path.join(this.workingDirectory(), this.relativePath());
    }

    public userPath(user: string): string {
        return path.join(this.workingDirectory(), ".users", user, this.relativePath());
    }

    public getUserVersion(user: string): FileBasic {
        if (this.isUserFile()) {
            return this;
        }
        return new (this.constructor as new (relativeFilePath: string, workingDirectory: string) => FileBasic)(
            path.join(".users", user, this.relativePath()),
            this.workingDirectory()
        );
    }

    public getMainVersion(): FileBasic {
        if (!this.isUserFile()) {
            return this;
        }
        return new (this.constructor as new (relativeFilePath: string, workingDirectory: string) => FileBasic)(
            this.relativePath().split(path.sep).slice(2).join(path.sep),
            this.workingDirectory()
        );
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
        return this.relativePath().split(path.sep).at(0) === ".users";
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
            fs.unlinkSync(this.absolutePath());
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    public isDirectory(): boolean {
        throw new Error("Not implemented");
    }

    public error(): unknown | null {
        return this._error;
    }

    public clone(): FileBasic {
        return new FileBasic(this.relativePath(), this.workingDirectory());
    }

    public toObject(): {[key: string]: string} {
        return {
            path: this.relativePath(),
            workingDirectory: this.workingDirectory(),
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
                this.workingDirectory() === other.workingDirectory()
            );
        }
        return this.relativePath() === other.relativePath() && this.workingDirectory() === other.workingDirectory();
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
