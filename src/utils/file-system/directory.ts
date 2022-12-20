import fs from "fs";
import path from "path";
import { FileBasic, IFileBasic } from "./basic";
import { File } from "./file";

export interface IDirectory extends IFileBasic {
    path(): string;
}

export class Directory extends FileBasic implements IDirectory {
    constructor(path: string, workingDirectory: string) {
        super(path, workingDirectory);
    }

    public getContent(): FileBasic[] {
        const filesAndDirs: FileBasic[] = [];
        const content = fs.readdirSync(this.path());
        content.forEach(el => {
            const fullPath = path.join(this.path(), el);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                filesAndDirs.push(new Directory(fullPath, this.workingDirectory()));
            } else {
                filesAndDirs.push(new File(fullPath, this.workingDirectory()));
            }
        });

        return filesAndDirs;
    }
}
