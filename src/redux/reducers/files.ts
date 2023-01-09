import {monaco} from "react-monaco-editor";

import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";
import {generateHashCode} from "@utils/hash";

import initialState from "@redux/initial-state";

import {CodeEditorViewState, DiffEditorViewState, File, FilesState} from "@shared-types/files";

import {SelectionDirection} from "monaco-editor";
import path from "path";

const disposeUnusedDefaultModel = (files: File[]) => {
    if (
        files.length === 1 &&
        files[0].filePath === path.join(__dirname, "Untitled-1.yaml") &&
        files[0].editorValue === ""
    ) {
        files.shift();
    }
};

const updateFilesInElectronStore = (state: Draft<FilesState>) => {
    const adjustedFiles = state.files.map(file => {
        const {editorViewState, ...rest} = file;
        return {
            ...rest,
            editorViewState: editorViewState === null ? "null" : editorViewState,
        };
    });
    electronStore.set("files.files", adjustedFiles);
};

export const filesSlice = createSlice({
    name: "files",
    initialState: initialState.files,
    reducers: {
        setFmuDirectoryPath: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                path: string;
            }>
        ) => {
            state.fmuDirectory = action.payload.path;
            electronStore.set("files.fmuDirectory", action.payload.path);
        },
        setWorkingDirectoryPath: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                path: string;
            }>
        ) => {
            state.directory = action.payload.path;
            state.fileTreeStates = {...state.fileTreeStates, [action.payload.path]: []};
            electronStore.set("files.directory", action.payload.path);
            electronStore.set(`files.fileTreeStates`, state.fileTreeStates);
        },
        setFileTreeStates: (state: Draft<FilesState>, action: PayloadAction<string[]>) => {
            const newState = {...state.fileTreeStates, [state.directory]: action.payload};
            state.fileTreeStates = newState;
            electronStore.set(`files.fileTreeStates`, newState);
        },
        setActiveFile: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                filePath: string;
                viewState: CodeEditorViewState | null;
            }>
        ) => {
            const currentlyActiveFile = state.files.find(file => file.filePath === state.activeFile);
            if (currentlyActiveFile) {
                currentlyActiveFile.editorViewState = action.payload.viewState;
            }
            state.activeFile = action.payload.filePath;
            electronStore.set("files.activeFile", action.payload.filePath);
        },
        setValue: (state: Draft<FilesState>, action: PayloadAction<string>) => {
            state.files = state.files.map(el =>
                el.filePath === state.activeFile ? {...el, editorValue: action.payload, unsavedChanges: true} : el
            );
        },
        setEditorViewState: (state: Draft<FilesState>, action: PayloadAction<CodeEditorViewState | null>) => {
            state.files = state.files.map(el =>
                el.filePath === state.activeFile
                    ? {
                          ...el,
                          editorViewState: action.payload,
                      }
                    : el
            );
            updateFilesInElectronStore(state);
        },
        setDiffEditorViewState: (state: Draft<FilesState>, action: PayloadAction<DiffEditorViewState | null>) => {
            state.files = state.files.map(el =>
                el.filePath === state.activeFile
                    ? {
                          ...el,
                          diffEditorViewState: action.payload,
                      }
                    : el
            );
            updateFilesInElectronStore(state);
        },
        addFile: (
            state: Draft<FilesState>,
            action: PayloadAction<{filePath: string; userFilePath: string; fileContent: string; permanentOpen: boolean}>
        ) => {
            // Do not open file when already opened, but make it active
            const openedFile = state.files.find(el => el.filePath === action.payload.filePath);
            state.activeFile = action.payload.filePath;
            electronStore.set("files.activeFile", action.payload.filePath);

            if (openedFile) {
                // Close all files that are not permanently open
                if (!openedFile.permanentOpen) {
                    state.files = state.files.filter(el => el.filePath === action.payload.filePath || el.permanentOpen);
                }
                return;
            }

            // Close all files that are not permanently open
            state.files = state.files.filter(el => el.permanentOpen);

            disposeUnusedDefaultModel(state.files);

            state.files.push({
                associatedWithFile: true,
                selection: {
                    startLineNumber: 0,
                    startColumn: 0,
                    endLineNumber: 0,
                    endColumn: 0,
                    direction: SelectionDirection.LTR,
                },
                editorValue: action.payload.fileContent,
                editorViewState: null,
                hash: generateHashCode(action.payload.fileContent),
                filePath: action.payload.filePath,
                title: "",
                permanentOpen: action.payload.permanentOpen,
            });

            updateFilesInElectronStore(state);
        },
        setPermanentOpen: (state: Draft<FilesState>, action: PayloadAction<string>) => {
            state.files = state.files.map(el =>
                el.filePath === action.payload
                    ? {
                          ...el,
                          permanentOpen: true,
                      }
                    : el
            );
            updateFilesInElectronStore(state);
        },
        closeFile: (state: Draft<FilesState>, action: PayloadAction<string>) => {
            const fileToClose = state.files.find(file => file.filePath === action.payload);
            if (fileToClose) {
                let newActiveFile = state.activeFile;
                if (action.payload === state.activeFile) {
                    if (state.files.length >= 2) {
                        newActiveFile = state.files.filter(el => el.filePath !== action.payload)[
                            Math.max(
                                0,
                                (state.files
                                    .filter(el => el.filePath !== action.payload)
                                    .findIndex(file => file.filePath === action.payload) || 0) - 1
                            )
                        ].filePath;
                    } else {
                        newActiveFile = "";
                    }
                    state.activeFile = newActiveFile;
                }
                state.files = state.files.filter(file => file.filePath !== action.payload);
                const model = monaco.editor.getModel(monaco.Uri.file(fileToClose.filePath));
                if (model) {
                    window.setTimeout(() => model.dispose(), 100); // Dispose model after 1 second - this is a workaround for an error that occurs in the DiffEditor when disposing the model immediately
                }
                updateFilesInElectronStore(state);
            }
        },
        closeAllFiles: (state: Draft<FilesState>) => {
            state.files.forEach(file => {
                const model = monaco.editor.getModel(monaco.Uri.file(file.filePath));
                if (model) {
                    window.setTimeout(() => model.dispose(), 100); // Dispose model after 1 second - this is a workaround for an error that occurs in the DiffEditor when disposing the model immediately
                }
            });
            state.files = [];
            state.activeFile = "";

            updateFilesInElectronStore(state);
        },
        markAsSaved: (state: Draft<FilesState>, action: PayloadAction<string>) => {
            state.files = state.files.map(f =>
                f.filePath === action.payload
                    ? {
                          ...f,
                          hash: generateHashCode(f.editorValue),
                          associatedWithFile: true,
                          permanentOpen: true,
                      }
                    : f
            );
        },
        changeFilePath: (
            state: Draft<FilesState>,
            action: PayloadAction<{oldFilePath: string; newFilePath: string}>
        ) => {
            const file = state.files.find(f => f.filePath === action.payload.oldFilePath);
            if (file) {
                state.files = state.files.map(f =>
                    f.filePath === action.payload.oldFilePath
                        ? {
                              ...f,
                              filePath: action.payload.newFilePath,
                              associatedWithFile: true,
                              unsavedChanges: false,
                          }
                        : f
                );
                if (action.payload.oldFilePath === state.activeFile) {
                    state.activeFile = action.payload.newFilePath;
                }
            }
        },
    },
});

export const {
    setFmuDirectoryPath,
    setWorkingDirectoryPath,
    setFileTreeStates,
    setActiveFile,
    addFile,
    closeFile,
    closeAllFiles,
    markAsSaved,
    changeFilePath,
    setValue,
    setEditorViewState,
    setDiffEditorViewState,
    setPermanentOpen,
} = filesSlice.actions;
export default filesSlice.reducer;
