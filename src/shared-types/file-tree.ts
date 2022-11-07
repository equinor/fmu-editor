export type FileTree = {
    path: string;
    name: string;
    type: "file" | "directory";
    children?: FileTree;
}[];

export type FileTreeWithState = {
    name: string;
    type: "file" | "directory";
    state: "expanded" | "collapsed";
    children?: FileTreeWithState;
}[];
