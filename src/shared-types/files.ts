import {SelectionDirection, editor} from "monaco-editor/esm/vs/editor/editor.api";

import {SpreadSheetSelection} from "./spreadsheet-selection";

export type CodeEditorViewState = {
    cursorState: editor.ICursorState[];
    viewState: {
        /** written by previous versions */
        scrollTop?: number;
        /** written by previous versions */
        scrollTopWithoutViewZones?: number;
        scrollLeft: number;
        firstPosition: {
            /**
             * line number (starts at 1)
             */
            readonly lineNumber: number;
            /**
             * column (the first character in a line is between column 1 and column 2)
             */
            readonly column: number;
        };
        firstPositionDeltaTop: number;
    };
    contributionsState: {
        [id: string]: any;
    };
};

export type SpreadSheetEditorViewState = {
    visibleWorkSheetName: string;
    viewStates: {
        scrollLeft: number;
        scrollTop: number;
        selection: SpreadSheetSelection;
        workSheetName: string;
    }[];
};

export type DiffEditorViewState = {
    original: CodeEditorViewState | null;
    modified: CodeEditorViewState | null;
};

export type File = {
    filePath: string; // Also used as identifier
    associatedWithFile: boolean;
    title: string;
    hash: string;
    permanentOpen: boolean;
};

export enum EventSource {
    Editor = "EDITOR",
    Preview = "PREVIEW",
    Plugin = "PLUGIN",
}

export type Selection = {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    direction: SelectionDirection;
};

export type FilesState = {
    fmuDirectoryPath: string;
    workingDirectoryPath: string;
    fileTreeStates: {[key: string]: string[]};
    files: File[];
    activeFilePath: string;
    eventSource: EventSource;
};
