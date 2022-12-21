import fs from "fs";

import {Directory, IDirectory} from "./directory";

export interface IWorkingDirectory extends IDirectory {
    getUsers(): string[];
}

export class WorkingDirectory extends Directory implements IWorkingDirectory {
    public getUsers(): string[] {
        const usersDir = this.usersDir();
        if (!fs.existsSync(usersDir)) {
            return [];
        }
        return fs.readdirSync(usersDir);
    }
}
