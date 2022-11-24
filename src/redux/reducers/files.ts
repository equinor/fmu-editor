import {monaco} from "react-monaco-editor";

import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";
import {generateHashCode} from "@utils/hash";

import initialState from "@redux/initial-state";

import {FileTreeStates} from "@shared-types/file-tree";
import {CodeEditorViewState, DiffEditorViewState, File, FilesState} from "@shared-types/files";

import fs from "fs";
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

export const filesSlice = createSlice({
    name: "files",
    initialState: initialState.files,
    reducers: {
        setFmuDirectory: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                path: string;
            }>
        ) => {
            state.fmuDirectory = action.payload.path;
            const directory =
                fs
                    .readdirSync(action.payload.path)
                    .find(file => fs.statSync(`${action.payload.path}/${file}`).isDirectory()) || "";

            state.directory = directory === "" ? directory : `${action.payload.path}/${directory}`;
            electronStore.set("files.fmuDirectory", action.payload.path);
        },
        setDirectory: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                path: string;
            }>
        ) => {
            state.directory = action.payload.path;
            state.fileTreeStates = {...state.fileTreeStates, [action.payload.path]: []};
            electronStore.set("files.directory", action.payload.path);
        },
        setFileTreeStates: (state: Draft<FilesState>, action: PayloadAction<FileTreeStates>) => {
            const newState = {...state.fileTreeStates, [state.directory]: action.payload};
            state.fileTreeStates = newState;
            electronStore.set(`ui.fileTreeStates`, newState);
        },
        resetFileTreeStates: (state: Draft<FilesState>) => {
            const newState = {...state.fileTreeStates, [state.directory]: []};
            state.fileTreeStates = newState;
            electronStore.set(`ui.fileTreeStates`, newState);
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
        },
        addFile: (
            state: Draft<FilesState>,
            action: PayloadAction<{filePath: string; userFilePath: string; fileContent: string}>
        ) => {
            // Do not open file when already opened, but make it active
            const openedFile = state.files.find(el => el.filePath === action.payload.filePath);
            state.activeFile = action.payload.filePath;
            electronStore.set("files.activeFile", action.payload.filePath);

            if (openedFile) {
                return;
            }

            disposeUnusedDefaultModel(state.files);

            monaco.editor.createModel(action.payload.fileContent, "yaml", monaco.Uri.file(action.payload.filePath));

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
                userFilePath: action.payload.userFilePath,
                title: "",
            });
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
            }
        },
        markAsSaved: (state: Draft<FilesState>, action: PayloadAction<{userFilePath: string; filePath: string}>) => {
            state.files = state.files.map(f =>
                f.filePath === action.payload.filePath
                    ? {
                          ...f,
                          hash: generateHashCode(f.editorValue),
                          userFilePath: action.payload.userFilePath,
                          associatedWithFile: true,
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
    setFmuDirectory,
    setDirectory,
    setFileTreeStates,
    resetFileTreeStates,
    setActiveFile,
    addFile,
    closeFile,
    markAsSaved,
    changeFilePath,
    setValue,
    setEditorViewState,
    setDiffEditorViewState,
} = filesSlice.actions;
export default filesSlice.reducer;
