import {FileTreeWithState} from "./file-tree";

export enum Themes {
    Dark = "dark",
    Light = "light",
}

export type PaneConfiguration = {
    name: string;
    sizes: number[];
};

export enum Pages {
    Editor = "editor",
    Play = "play",
    Preferences = "preferences",
}

export type UiState = {
    currentPage: Pages;
    settings: {
        theme: Themes;
        editorFontSize: number;
    };
    paneConfiguration: PaneConfiguration[];
    fileTreeState: FileTreeWithState;
};
