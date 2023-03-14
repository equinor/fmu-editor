import {generateHashCode} from "@utils/hash";

import fs from "fs";
import path from "path";

import {FileBasic, IFileBasic} from "./basic";
import {File} from "./file";

export interface IDirectory extends IFileBasic {
    getContent(): FileBasic[];
    getFilesRecursively(): File[];
    makeIfNotExists(): boolean;
    countFiles(recursively?: boolean): number;
    getHash(recursive?: boolean): string;
    isDirectory(): boolean;
}

export class Directory extends FileBasic implements IDirectory {
    public getContent(recursive = false): FileBasic[] {
        const filesAndDirs: FileBasic[] = [];
        const content = fs.readdirSync(this.absolutePath()).filter(item => !/(^|\/)\.[^\/\.]/g.test(item));
        content.forEach(el => {
            const fullPath = path.join(this.absolutePath(), el);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                const dir = new Directory(path.join(this.relativePath(), el), this.workingDirectoryPath());
                filesAndDirs.push(dir);
                if (recursive) {
                    filesAndDirs.push(...dir.getContent(true));
                }
            } else {
                filesAndDirs.push(new File(path.join(this.relativePath(), el), this.workingDirectoryPath()));
            }
        });

        return filesAndDirs;
    }

    public getHash(recursive = true): string {
        let hash = "";
        this.getContent().forEach(el => {
            if (el.isDirectory()) {
                hash += generateHashCode((el as Directory).absolutePath());
                if (recursive) {
                    hash += (el as Directory).getHash();
                }
            } else {
                hash += generateHashCode((el as File).absolutePath());
            }
        });
        return hash;
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

    public isEmpty(): boolean {
        return this.getContent().length === 0;
    }

    public makeIfNotExists(): boolean {
        if (this.exists()) {
            return true;
        }
        try {
            fs.mkdirSync(this.absolutePath(), {recursive: true});
        } catch (e) {
            this._error = e;
            return false;
        }
        return true;
    }

    public countFiles(recursively = false): number {
        if (recursively) {
            return this.getFilesRecursively().length;
        }
        return this.getContent().filter(el => !el.isDirectory()).length;
    }

    // eslint-disable-next-line class-methods-use-this
    public isDirectory(): boolean {
        return true;
    }
}
