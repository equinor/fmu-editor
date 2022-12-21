import fs from "fs";
import path from "path";

import {FileBasic, IFileBasic} from "./basic";
import {File} from "./file";

export interface IDirectory extends IFileBasic {
    getContent(): FileBasic[];
    getFilesRecursively(): File[];
}

export class Directory extends FileBasic implements IDirectory {
    public getContent(): FileBasic[] {
        const filesAndDirs: FileBasic[] = [];
        const content = fs.readdirSync(this.absolutePath()).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
        content.forEach(el => {
            const fullPath = path.join(this.absolutePath(), el);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                filesAndDirs.push(new Directory(path.join(this.relativePath(), el), this.workingDirectory()));
            } else {
                filesAndDirs.push(new File(path.join(this.relativePath(), el), this.workingDirectory()));
            }
        });

        return filesAndDirs;
    }

    public getFilesRecursively(): File[] {
        const files: File[] = [];
        const content = this.getContent();
        content.forEach(el => {
            if (el.isDirectory()) {
                files.push(...(el as Directory).getFilesRecursively());
            } else {
                files.push(el as File);
            }
        });
        return files;
    }

    // eslint-disable-next-line class-methods-use-this
    public isDirectory(): boolean {
        return true;
    }
}
