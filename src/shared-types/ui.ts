import {ICommitExtended} from "./changelog";

export enum Themes {
    Dark = "dark",
    Light = "light",
}

export type PaneConfiguration = {
    name: string;
    sizes: number[];
};

export enum Page {
    Editor = "editor",
    DiffEditor = "source-control",
}

export type UiState = {
    page: Page;
    settings: {
        theme: Themes;
        editorFontSize: number;
    };
    paneConfiguration: PaneConfiguration[];
    currentCommit?: ICommitExtended;
};
