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
    DiffEditor = "diff-editor",
}

export type UiState = {
    currentPage: Pages;
    settings: {
        theme: Themes;
        editorFontSize: number;
    };
    paneConfiguration: PaneConfiguration[];
};
