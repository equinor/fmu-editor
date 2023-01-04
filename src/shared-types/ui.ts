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

export enum View {
    Main = "main",
    OngoingChanges = "ongoing-changes",
    SingleFileChanges = "single-file-changes",
    Merge = "merge",
}

export enum ChangesBrowserView {
    CurrentChanges = "current-changes",
    LoggedChanges = "logged-changes",
}

export type UiState = {
    view: View;
    page: Page;
    settings: {
        theme: Themes;
        editorFontSize: number;
    };
    paneConfiguration: PaneConfiguration[];
    currentCommit?: ICommitExtended;
    ongoingChangesFile?: string;
    changesBrowserView: ChangesBrowserView;
    previewOpen: boolean;
    mergeMainFile?: string;
    mergeUserFile?: string;
};
