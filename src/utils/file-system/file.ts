import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface IFile {
    path(): string;
}

export enum ModificationOwner {
    WorkingDirectory = "WorkingDirectory",
    User = "User",
}

export type Modification = {
    owner: ModificationOwner;
    user?: string;
    location: string;
};

export class File implements IFile {
    private _path: string;
    private _workingDirectory: string;
    private _modified: number;
    private _created: number;
    private _hash: string | null;

    constructor(filePath: string, workingDirectory: string) {
        this._path = filePath;
        this._workingDirectory = workingDirectory;
        this._modified = 0;
        this._created = 0;
        this._hash = null;
    }

    public path(): string {
        return this._path;
    }

    public workingDirectory(): string {
        return this._workingDirectory;
    }

    public exists(): boolean {
        return fs.existsSync(this.path());
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

    public hash(): string | null {
        if (this.modifiedTime() === this._modified && this._hash) {
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

    private usersDir(): string {
        return path.join(this.workingDirectory(), ".users");
    }

    private getAllUserVersions(): string[] {
        if (!fs.existsSync(this.usersDir())) {
            return [];
        }

        const users = fs.readdirSync(this.usersDir());
        return users.map(user => path.join(this.usersDir(), user, this.relativePath())).filter(p => fs.existsSync(p));
    }

    private extractUserFromPath(userPath: string): string {
        const parts = path.relative(this.workingDirectory(), userPath).split(path.sep);
        if (parts.at(0) === ".users" && parts.length > 2) {
            return parts.at(1);
        }
        return "";
    }

    public getModifications(): Modification[] {
        const modifications: Modification[] = [];

        const userVersions = this.getAllUserVersions();
        userVersions.forEach(userVersion => {
            const user = this.extractUserFromPath(userVersion);
            const stats = fs.statSync(userVersion);
            if (stats.mtimeMs > this.modifiedTime()) {
                modifications.push({
                    owner: ModificationOwner.User,
                    user,
                    location: userVersion,
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

    public remove(): boolean {
        try {
            fs.unlinkSync(this.path());
            return true;
        } catch (e) {
            return false;
        }
    }
}
