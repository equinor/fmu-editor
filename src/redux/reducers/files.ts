import {ipcRenderer} from "electron";

import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";
import {generateHashCode} from "@utils/hash";
import {LayoutObject, YamlMetaObject, YamlObject} from "@utils/yaml-parser";

import initialState from "@redux/initial-state";

import {FileTreeStates} from "@shared-types/file-tree";
import {CodeEditorViewState, EventSource, File, FilesState} from "@shared-types/files";
import {NavigationType} from "@shared-types/navigation";

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
        addFile: (state: Draft<FilesState>, action: PayloadAction<{filePath: string; fileContent: string}>) => {
            // Do not open file when already opened, but make it active
            const openedFile = state.files.find(el => el.filePath === action.payload.filePath);
            state.activeFile = action.payload.filePath;
            electronStore.set("files.activeFile", action.payload.filePath);

            if (openedFile) {
                return;
            }

            disposeUnusedDefaultModel(state.files);

            if (!state.recentFiles.includes(action.payload.filePath)) {
                state.recentFiles.push(action.payload.filePath);
                electronStore.set("files.recentFiles", state.recentFiles);
                ipcRenderer.send("set-recent-files", [...state.recentFiles]);
            }
            state.files.push({
                currentPage: undefined,
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
                navigationItems: [],
                yamlObjects: [],
                selectedYamlObject: undefined,
                title: "",
            });
        },
        addNewFile: (state: Draft<FilesState>) => {
            const filePath = path.join(
                __dirname,
                `Untitled-${state.files.filter(file => file.filePath.includes("Untitled-")).length + 1}.yaml`
            );
            state.files.push({
                currentPage: undefined,
                associatedWithFile: false,
                selection: {
                    startLineNumber: 0,
                    startColumn: 0,
                    endLineNumber: 0,
                    endColumn: 0,
                    direction: SelectionDirection.LTR,
                },
                editorValue: "",
                editorViewState: null,
                hash: generateHashCode(""),
                filePath,
                navigationItems: [],
                yamlObjects: [],
                selectedYamlObject: undefined,
                title: "",
            });
            if (state.files.length === 1) {
                state.activeFile = filePath;
            }
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
            }
        },
        markAsSaved: (state: Draft<FilesState>, action: PayloadAction<string>) => {
            if (!state.recentFiles.includes(action.payload)) {
                state.recentFiles.push(action.payload);
                electronStore.set("files.recentFiles", state.recentFiles);
                ipcRenderer.send("set-recent-files", state.recentFiles);
            }
            state.files = state.files.map(f =>
                f.filePath === action.payload
                    ? {
                          ...f,
                          hash: generateHashCode(f.editorValue),
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
        setFileObjects: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                yamlObjects: YamlObject[];
                title: string;
                navigationItems: NavigationType;
            }>
        ) => {
            state.files = state.files.map(file =>
                file.filePath === state.activeFile
                    ? {
                          ...file,
                          yamlObjects: action.payload.yamlObjects,
                          title: action.payload.title,
                          navigationItems: action.payload.navigationItems,
                      }
                    : file
            );
        },
        setFileObjectsAndSelection: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                yamlObjects: YamlObject[];
                selectedObject: YamlMetaObject;
                page: LayoutObject;
            }>
        ) => {
            state.files = state.files.map(file =>
                file.filePath === state.activeFile
                    ? {
                          ...file,
                          yamlObjects: action.payload.yamlObjects,
                          currentPage: action.payload.page,
                          selectedYamlObject: action.payload.selectedObject,
                      }
                    : file
            );
        },
        setSelectedObject: (
            state: Draft<FilesState>,
            action: PayloadAction<{
                object: YamlMetaObject | undefined;
                page: LayoutObject;
                source: EventSource;
            }>
        ) => {
            state.eventSource = action.payload.source;
            state.files = state.files.map(file =>
                file.filePath === state.activeFile
                    ? {
                          ...file,
                          selectedYamlObject: action.payload.object,
                          currentPage: action.payload.page,
                      }
                    : file
            );
        },
        setRecentFiles: (state: Draft<FilesState>, action: PayloadAction<string[]>) => {
            state.recentFiles = action.payload;
            ipcRenderer.send("set-recent-files", state.recentFiles);
            electronStore.set("files.recentFiles", state.recentFiles);
        },
        clearRecentFiles: (state: Draft<FilesState>) => {
            state.recentFiles = [];
            ipcRenderer.send("clear-recent-files", state.recentFiles);
            electronStore.set("files.recentFiles", []);
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
    addNewFile,
    closeFile,
    markAsSaved,
    changeFilePath,
    setFileObjects,
    setFileObjectsAndSelection,
    setSelectedObject,
    setValue,
    setEditorViewState,
    setRecentFiles,
    clearRecentFiles,
} = filesSlice.actions;
export default filesSlice.reducer;
