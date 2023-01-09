import {generateHashCode} from "@utils/hash";

import fs from "fs";
import path from "path";

import {FileBasic, IFileBasic} from "./basic";

export interface IFile extends IFileBasic {
    hash(): string | null;
    readString(): string | null;
    readJson(): any | null;
    getModifications(): Modification[];
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

    constructor(filePath: string, workingDirectory: string) {
        super(filePath, workingDirectory);
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

    // eslint-disable-next-line class-methods-use-this
    public isDirectory(): boolean {
        return false;
    }

    public compare(other: File): boolean {
        return this.hash() === other.hash();
    }
}
