export enum Themes {
    Dark = "dark",
    Light = "light",
}

export type PaneConfiguration = {
    name: string;
    sizes: number[];
};

export enum EditorMode {
    Editor = "editor",
    DiffEditor = "diff-editor",
}

export type UiState = {
    editorMode: EditorMode;
    settings: {
        theme: Themes;
        editorFontSize: number;
    };
    paneConfiguration: PaneConfiguration[];
};
