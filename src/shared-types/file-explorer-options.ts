import {FileFilter} from "@shared-types/settings";

export type DirectoryOptions = {
    isDirectoryExplorer: true;
    defaultPath?: string;
    title?: string;
};

export type FileOptions = {
    isDirectoryExplorer?: false;
    allowMultiple?: boolean;
    filters: FileFilter[];
    defaultPath?: string;
    title?: string;
    action?: "save" | "open";
};

export type FileExplorerOptions = DirectoryOptions | FileOptions;
