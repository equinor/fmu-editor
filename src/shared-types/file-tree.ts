export type FileTreeItem = {
    path: string;
    name: string;
    type: "file" | "directory";
    children?: FileTree;
};

export type FileTree = FileTreeItem[];

export type FileTreeStates = {
    expanded: boolean;
    children?: FileTreeStates;
}[];
