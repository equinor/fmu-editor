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

export enum View {
    OngoingChanges = "ongoing-changes",
    SingleFileChanges = "single-file-changes",
    Merge = "merge",
    Editor = "editor",
    SourceControl = "source-control",
}

export enum ChangesBrowserView {
    CurrentChanges = "current-changes",
    LoggedChanges = "logged-changes",
}

export type UiState = {
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
    firstTimeUser: boolean;
};
