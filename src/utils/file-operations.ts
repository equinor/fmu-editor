import {FileTree} from "@shared-types/file-tree";

import fs from "fs";

export const getFileContent = (filePath: string): string => {
    try {
        return fs.readFileSync(filePath).toString();
    } catch (e) {
        return "";
    }
};

export const readFileTree = (dir: string): FileTree => {
    const files = fs.readdirSync(dir);
    const fileTree: FileTree = [];

    files.forEach(file => {
        const filePath = `${dir}/${file}`;
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            fileTree.push({
                path: filePath,
                name: file,
                type: "directory",
                children: readFileTree(filePath),
            });
        } else {
            fileTree.push({
                path: filePath,
                name: file,
                type: "file",
            });
        }
    });
    return fileTree;
};
