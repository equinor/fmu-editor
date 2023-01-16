import fs from "fs";
import path from "path";

import {Directory, IDirectory} from "./directory";

export interface IWorkingDirectory extends IDirectory {
    getUsers(): string[];
    getUserDirectory(username: string): Directory
}

export class WorkingDirectory extends Directory implements IWorkingDirectory {
    public getUsers(): string[] {
        const usersDir = this.usersDir();
        if (!fs.existsSync(usersDir)) {
            return [];
        }
        return fs.readdirSync(usersDir);
    }

    public getUserDirectory(username: string): Directory {
        return new Directory(path.relative(this.workingDirectory(), path.join(this.usersDir(), username)), this.workingDirectory());
    }
}
