import {LayoutObject, YamlMetaObject, YamlObject} from "@utils/yaml-parser";

import {NavigationType} from "@shared-types/navigation";

import {
    SelectionDirection,
    editor,
} from "monaco-editor/esm/vs/editor/editor.api";

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

export type File = {
    filePath: string; // Also used as identifier
    associatedWithFile: boolean;
    editorValue: string;
    editorViewState: CodeEditorViewState | null;
    hash: number;
    selection: Selection;
    navigationItems: NavigationType;
    yamlObjects: YamlObject[];
    selectedYamlObject: YamlMetaObject | undefined;
    currentPage: LayoutObject | undefined;
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
    directory: string;
    files: File[];
    activeFile: string;
    recentFiles: string[];
    eventSource: EventSource;
};
