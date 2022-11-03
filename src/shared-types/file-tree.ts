export type FileTree = {
    path: string;
    name: string;
    type: "file" | "directory";
    children?: FileTree;
}[];
