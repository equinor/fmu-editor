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
    SourceControl = "source-control",
}

export enum ChangesBrowserView {
    CurrentChanges = "current-changes",
    LoggedChanges = "logged-changes",
}

export type UiState = {
    page: Page;
    settings: {
        theme: Themes;
        editorFontSize: number;
    };
    paneConfiguration: PaneConfiguration[];
    currentCommit?: ICommitExtended;
    userChangesFile?: string;
    changesBrowserView: ChangesBrowserView;
};
