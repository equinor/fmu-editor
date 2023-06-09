import {generateHashCode} from "@utils/hash";

import fs from "fs";
import path from "path";

import {FileBasic, IFileBasic} from "./basic";

export interface IFile extends IFileBasic {
    hash(): string | null;
    readString(): string | null;
    readJson(): any | null;
    readBuffer(): Buffer | null;
    getModifications(): Modification[];
    writeString(str: string): boolean;
    writeJson(json: any): boolean;
    writeBuffer(buffer: Buffer): boolean;
    copyTo(destination: string): boolean;
    push(): boolean;
    pull(username: string): boolean;
    isDirectory(): boolean;
    compare(other: File): boolean;
    extension(): string;
}

export enum ModificationOwner {
    WorkingDirectory = "WorkingDirectory",
    User = "User",
}

type UserVersion = {
    user: string;
    path: string;
};

export type Modification = {
    owner: ModificationOwner;
    user?: string;
    path: string;
};

export class File extends FileBasic implements IFile {
    private _hash: string | null;

    constructor(filePath: string, workingDirectoryPath: string) {
        super(filePath, workingDirectoryPath);
        this._hash = null;
    }

    public hash(): string | null {
        if (this.modifiedTime() === this._modified && this._hash) {
            return this._hash;
        }

        try {
            const buffer = fs.readFileSync(this.absolutePath());
            const hash = generateHashCode(buffer);
            this._hash = hash;
            return hash;
        } catch (e) {
            this._error = e;
            return null;
        }
    }

    public copyTo(destination: string): boolean {
        try {
            fs.copyFileSync(this.absolutePath(), destination);
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    private getAllUserVersions(): UserVersion[] {
        if (!fs.existsSync(this.usersDir())) {
            return [];
        }

        const users = fs.readdirSync(this.usersDir());
        return users
            .map(user => ({path: path.join(this.usersDir(), user, this.relativePath()), user}))
            .filter(p => fs.existsSync(p.path));
    }

    public getModifications(): Modification[] {
        const modifications: Modification[] = [];

        const userVersions = this.getAllUserVersions();
        userVersions.forEach(userVersion => {
            const stats = fs.statSync(userVersion.path);
            if (stats.mtimeMs > this.modifiedTime()) {
                modifications.push({
                    owner: ModificationOwner.User,
                    user: userVersion.user,
                    path: userVersion.path,
                });
            }
        });

        return modifications;
    }

    public readString(): string | null {
        try {
            const content = fs.readFileSync(this.absolutePath(), {encoding: "utf-8"}).toString();
            return content;
        } catch (e) {
            this._error = e;
            return null;
        }
    }

    public writeString(str: string): boolean {
        try {
            fs.writeFileSync(this.absolutePath(), str, {encoding: "utf-8"});
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public readJson(): any | null {
        try {
            const content = JSON.parse(this.readString());
            return content;
        } catch (e) {
            this._error = e;
            return null;
        }
    }

    public writeJson(json: any): boolean {
        try {
            this.writeString(JSON.stringify(json));
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public readBuffer(): Buffer | null {
        try {
            const content = fs.readFileSync(this.absolutePath());
            return content;
        } catch (e) {
            this._error = e;
            return null;
        }
    }

    public writeBuffer(buffer: Buffer): boolean {
        try {
            fs.writeFileSync(this.absolutePath(), buffer);
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public push(): boolean {
        if (!this.isUserFile() || !this.exists()) {
            return false;
        }
        try {
            if (this.getMainVersion().exists()) {
                fs.unlinkSync(this.getMainVersion().absolutePath());
            }
            if (!fs.existsSync(this.getMainVersion().parentDirectoryPath())) {
                fs.mkdirSync(this.getMainVersion().parentDirectoryPath(), {recursive: true});
            }
            fs.copyFileSync(this.absolutePath(), this.getMainVersion().absolutePath());
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    public pull(username: string): boolean {
        if (this.isUserFile() || !this.exists()) {
            return false;
        }
        try {
            if (this.getUserVersion(username).exists()) {
                fs.unlinkSync(this.getUserVersion(username).absolutePath());
            }
            if (!fs.existsSync(this.getUserVersion(username).parentDirectoryPath())) {
                fs.mkdirSync(this.getUserVersion(username).parentDirectoryPath(), {recursive: true});
            }
            fs.copyFileSync(this.absolutePath(), this.getUserVersion(username).absolutePath());
            return true;
        } catch (e) {
            this._error = e;
            return false;
        }
    }

    // eslint-disable-next-line class-methods-use-this
    public isDirectory(): boolean {
        return false;
    }

    public compare(other: File): boolean {
        return this.hash() === other.hash();
    }

    public extension(): string {
        return path.extname(this.absolutePath());
    }
}
