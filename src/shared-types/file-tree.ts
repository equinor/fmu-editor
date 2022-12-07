export type FileTreeItem = {
    path: string;
    name: string;
    type: "file" | "directory";
    modified: Date;
    children?: FileTree;
    fileSize?: number;
};

export type FileTree = FileTreeItem[];
