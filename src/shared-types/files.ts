import {SelectionDirection, editor} from "monaco-editor/esm/vs/editor/editor.api";

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

export type DiffEditorViewState = {
    original: CodeEditorViewState | null;
    modified: CodeEditorViewState | null;
};

export type File = {
    filePath: string; // Also used as identifier
    userFilePath: string;
    associatedWithFile: boolean;
    editorValue: string;
    editorViewState: CodeEditorViewState | null;
    hash: number;
    selection: Selection;
    title: string;
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
    fmuDirectory: string;
    directory: string;
    fileTreeStates: {[key: string]: string[]};
    files: File[];
    activeFile: string;
    activeDiffFile: string | null;
    eventSource: EventSource;
};
