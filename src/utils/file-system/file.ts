import crypto from "crypto";
import fs from "fs";
import path from "path";
import { FileBasic, IFileBasic } from "./basic";

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
}

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
        if (this.modifiedTime() === super._modified && this._hash) {
            return this._hash;
        }

        try {
            const buffer = fs.readFileSync(this.path());
            const hash = crypto.createHash("sha256").update(buffer).digest("hex");
            this._hash = hash;
            return hash;
        } catch (e) {
            return null;
        }
    }

    private getAllUserVersions(): UserVersion[] {
        if (!fs.existsSync(this.usersDir())) {
            return [];
        }

        const users = fs.readdirSync(this.usersDir());
        return users.map(user => ({path: path.join(this.usersDir(), user, this.relativePath()), user})).filter(p => fs.existsSync(p.path));
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
            const content = fs.readFileSync(this.path()).toString();
            return content;
        } catch (e) {
            return null;
        }
    }

    public readJson(): any | null {
        try {
            const content = JSON.parse(this.readString());
            return content;
        } catch (e) {
            return null;
        }
    }
}
