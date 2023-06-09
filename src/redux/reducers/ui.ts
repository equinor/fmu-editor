import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";

import initialState from "@redux/initial-state";

import {ICommitExtended} from "@shared-types/changelog";
import {FileChangeOrigin} from "@shared-types/file-changes";
import {ChangesBrowserView, PaneConfiguration, Themes, UiState, View} from "@shared-types/ui";

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialState.ui,
    reducers: {
        setView: (state: Draft<UiState>, action: PayloadAction<View>) => {
            state.view = action.payload;
            if ([View.Editor, View.SourceControl].includes(action.payload)) {
                electronStore.set("ui.activeView", action.payload);
            }
        },
        setTheme: (state: Draft<UiState>, action: PayloadAction<Themes>) => {
            electronStore.set("ui.settings.theme", action.payload);
            state.settings.theme = action.payload;
        },
        setPaneConfiguration: (state: Draft<UiState>, action: PayloadAction<PaneConfiguration>) => {
            electronStore.set(`ui.paneConfiguration.${action.payload.name}`, action.payload.sizes);
            const paneConfiguration = state.paneConfiguration.find(el => el.name === action.payload.name);
            if (paneConfiguration) {
                paneConfiguration.sizes = action.payload.sizes;
            } else {
                state.paneConfiguration.push({
                    name: action.payload.name,
                    sizes: action.payload.sizes,
                });
            }
        },
        setEditorFontSize: (state: Draft<UiState>, action: PayloadAction<number>) => {
            electronStore.set("ui.settings.editorFontSize", action.payload);
            state.settings.editorFontSize = action.payload;
        },
        setCurrentCommit: (state: Draft<UiState>, action: PayloadAction<ICommitExtended | undefined>) => {
            state.currentCommit = action.payload;
        },
        setDiffModifiedFilePath: (
            state: Draft<UiState>,
            action: PayloadAction<{modifiedRelativeFilePath?: string}>
        ) => {
            state.diff.modifiedRelativeFilePath = action.payload.modifiedRelativeFilePath;
        },
        setDiffOriginalFilePath: (
            state: Draft<UiState>,
            action: PayloadAction<{originalRelativeFilePath?: string}>
        ) => {
            state.diff.originalRelativeFilePath = action.payload.originalRelativeFilePath;
        },
        setChangesBrowserView: (state: Draft<UiState>, action: PayloadAction<ChangesBrowserView>) => {
            state.changesBrowserView = action.payload;
        },
        setPreviewOpen: (state: Draft<UiState>, action: PayloadAction<boolean>) => {
            state.previewOpen = action.payload;
        },
        setDiffFiles: (
            state: Draft<UiState>,
            action: PayloadAction<{
                originalRelativeFilePath?: string;
                modifiedRelativeFilePath?: string;
                origin: FileChangeOrigin;
            }>
        ) => {
            state.diff.originalRelativeFilePath = action.payload.originalRelativeFilePath;
            state.diff.modifiedRelativeFilePath = action.payload.modifiedRelativeFilePath;
            state.diff.fileOrigin = action.payload.origin;
        },
        resetDiffFiles: (state: Draft<UiState>) => {
            state.diff.originalRelativeFilePath = undefined;
            state.diff.modifiedRelativeFilePath = undefined;
            state.diff.fileOrigin = undefined;
        },
        setDragParentFolder: (state: Draft<UiState>, action: PayloadAction<string>) => {
            state.explorer.dragParentFolder = action.payload;
        },
        resetDragParentFolder: (state: Draft<UiState>) => {
            state.explorer.dragParentFolder = null;
        },
        setCreateFile: (state: Draft<UiState>, action: PayloadAction<boolean>) => {
            state.explorer.createFile = action.payload;
        },
        setCreateFolder: (state: Draft<UiState>, action: PayloadAction<boolean>) => {
            state.explorer.createFolder = action.payload;
        },
        setActiveItemPath: (state: Draft<UiState>, action: PayloadAction<string>) => {
            state.explorer.activeItemPath = action.payload;
        },
        setFirstTimeUser: (state: Draft<UiState>, action: PayloadAction<boolean>) => {
            state.firstTimeUser = action.payload;
            electronStore.set("ui.firstTimeUser", action.payload);
        },
    },
});

export const {
    setView,
    setTheme,
    setPaneConfiguration,
    setEditorFontSize,
    setCurrentCommit,
    setChangesBrowserView,
    setPreviewOpen,
    setDiffFiles,
    setDiffOriginalFilePath,
    setDiffModifiedFilePath,
    resetDiffFiles,
    setDragParentFolder,
    resetDragParentFolder,
    setCreateFile,
    setCreateFolder,
    setActiveItemPath,
    setFirstTimeUser,
} = uiSlice.actions;
export default uiSlice.reducer;
