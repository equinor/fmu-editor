import fs from "fs";
import path from "path";

export class FileManager {
    private username: string;
    private fmuDirectory: string;
    private currentDirectory: string | null;
    private error: string;

    constructor(username?: string, fmuDirectory?: string) {
        this.username = username || "";
        this.fmuDirectory = fmuDirectory || "";

        this.currentDirectory = null;
        this.error = "";
    }

    getCurrentDirectory(): string | null {
        return this.currentDirectory;
    }

    setUsername(username: string) {
        this.username = username;
    }

    setFmuDirectory(fmuDirectory: string) {
        this.fmuDirectory = fmuDirectory;
    }

    getFmuDirectory(): string {
        return this.fmuDirectory;
    }

    setCurrentDirectory(currentDirectory: string) {
        this.currentDirectory = currentDirectory;
    }

    userDirectory(user?: string): string {
        if (!this.currentDirectory) {
            return "";
        }
        return path.join(this.currentDirectory, ".users", user || this.username);
    }

    userDirectoryExists(): boolean {
        return fs.existsSync(this.userDirectory());
    }

    maybeCreateTempUserDirectory(): boolean {
        if (!this.currentDirectory) return false;

        try {
            if (!fs.existsSync(this.userDirectory())) {
                fs.mkdirSync(this.userDirectory(), {recursive: true});
            }
            return true;
        } catch (e) {
            this.error = `${e}`;
            return false;
        }
    }

    modifyFilePath(originalFilePath: string, user?: string): string {
        if (!this.currentDirectory) return originalFilePath;

        const newFilePath = originalFilePath.replace(this.currentDirectory, this.userDirectory(user));
        return newFilePath;
    }

    unmodifyFilePath(originalFilePath: string): string {
        if (!this.currentDirectory) return originalFilePath;

        const [userDir, user, ...filePathParts] = path
            .relative(this.currentDirectory, originalFilePath)
            .split(path.sep);

        const newFilePath = path.join(this.currentDirectory, ...filePathParts);

        return newFilePath;
    }

    relativeFilePath(filePath: string): string {
        if (!this.currentDirectory) return filePath;

        return path.relative(this.currentDirectory, filePath);
    }

    saveFile(filePath: string, value: string): {success: boolean; filePath: string} {
        const newFilePath = this.modifyFilePath(filePath);
        const dir = path.dirname(newFilePath);

        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {recursive: true});
            }
            fs.writeFileSync(newFilePath, value, {
                encoding: "utf-8",
                flag: "w",
            });
            return {success: true, filePath: newFilePath};
        } catch (e) {
            this.error = `${e}`;
            return {success: false, filePath: ""};
        }
    }

    readFile(filePath: string): {content: string; filePath: string} {
        let adjustedFilePath = this.modifyFilePath(filePath);
        if (!fs.existsSync(adjustedFilePath)) {
            adjustedFilePath = filePath;
        }
        try {
            return {content: fs.readFileSync(adjustedFilePath).toString(), filePath: adjustedFilePath};
        } catch (e) {
            this.error = `${e}`;
            return {content: "", filePath: adjustedFilePath};
        }
    }

    commitFileChanges(files: string[]): boolean {
        if (!this.currentDirectory) return false;

        try {
            files.forEach(file => {
                const originalFilePath = this.unmodifyFilePath(file);

                if (fs.existsSync(file) && fs.existsSync(originalFilePath)) {
                    fs.unlinkSync(originalFilePath);
                    fs.copyFileSync(file, originalFilePath);
                }
            });
        } catch (e) {
            this.error = `${e}`;
            return false;
        }
        return true;
    }

    getUserFileIfExists(filePath: string, user?: string): string {
        const newFilePath = this.modifyFilePath(filePath, user);
        if (fs.existsSync(newFilePath)) {
            return newFilePath;
        }
        return filePath;
    }

    getOriginalFileIfExists(filePath: string): string {
        const newFilePath = this.unmodifyFilePath(filePath);
        if (fs.existsSync(newFilePath)) {
            return newFilePath;
        }
        return filePath;
    }

    makeOriginalFilePath(relativeFilePath: string, compareSnapshotPath: string | null): string {
        if (compareSnapshotPath) {
            return path.join(compareSnapshotPath, relativeFilePath);
        }
        if (!this.currentDirectory) return "";
        return path.join(this.currentDirectory, relativeFilePath);
    }
}
