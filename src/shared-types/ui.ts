import {ICommitExtended} from "./changelog";
import {FileChangeOrigin} from "./file-changes";

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
    // Page is the main page of the app, e.g. editor, source control
    page: Page;
    // View is the view of the current page, e.g. main, ongoing changes, single file changes, merge
    view: View;
    settings: {
        theme: Themes;
        editorFontSize: number;
    };
    paneConfiguration: PaneConfiguration[];
    currentCommit?: ICommitExtended;
    ongoingChangesRelativeFilePath?: string;
    changesBrowserView: ChangesBrowserView;
    previewOpen: boolean;
    diff: {
        originalRelativeFilePath?: string;
        modifiedRelativeFilePath?: string;
        fileOrigin?: FileChangeOrigin;
    };
    explorer: {
        activeItemPath: string;
        dragParentFolder: string | null;
        createFolder: boolean;
        createFile: boolean;
    };
};
