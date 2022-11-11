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

    setUsername(username: string) {
        this.username = username;
    }

    setFmuDirectory(fmuDirectory: string) {
        this.fmuDirectory = fmuDirectory;
    }

    setCurrentDirectory(currentDirectory: string) {
        this.currentDirectory = currentDirectory;
        this.maybeCreateTempUserDirectory();
    }

    userDirectory(): string {
        if (!this.currentDirectory) {
            return "";
        }
        this.maybeCreateTempUserDirectory();
        return path.join(this.currentDirectory, ".users", this.username);
    }

    maybeCreateTempUserDirectory(): boolean {
        if (!this.currentDirectory) return false;

        try {
            if (!fs.existsSync(this.userDirectory())) {
                fs.mkdirSync(this.userDirectory());
            }
            return true;
        } catch (e) {
            this.error = `${e}`;
            return false;
        }
    }

    modifyFilePath(originalFilePath: string): string {
        if (!this.currentDirectory) return originalFilePath;

        const newFilePath = originalFilePath.replace(this.currentDirectory, this.userDirectory());
        return newFilePath;
    }

    saveFile(filePath: string, value: string): {success: boolean; filePath: string} {
        const newFilePath = this.modifyFilePath(filePath);
        const dir = path.dirname(newFilePath);

        try {
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
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

    readFile(filePath: string): { content: string; filePath: string; } {
        let adjustedFilePath = this.modifyFilePath(filePath);
        if (!fs.existsSync(adjustedFilePath)) {
            adjustedFilePath = filePath;
        }
        try {
            return { content: fs.readFileSync(adjustedFilePath).toString(), filePath: adjustedFilePath };
        } catch (e) {
            this.error = `${e}`;
            return { content: "", filePath: adjustedFilePath };
        }
    }
}
