import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";

import initialState from "@redux/initial-state";

import {ICommitExtended} from "@shared-types/changelog";
import {ChangesBrowserView, Page, PaneConfiguration, Themes, UiState, View} from "@shared-types/ui";

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialState.ui,
    reducers: {
        setView: (state: Draft<UiState>, action: PayloadAction<View>) => {
            state.view = action.payload;
        },
        setPage: (state: Draft<UiState>, action: PayloadAction<Page>) => {
            state.page = action.payload;
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
        setOngoingChangesFile: (state: Draft<UiState>, action: PayloadAction<string>) => {
            state.ongoingChangesFile = action.payload;
        },
        setChangesBrowserView: (state: Draft<UiState>, action: PayloadAction<ChangesBrowserView>) => {
            state.changesBrowserView = action.payload;
        },
        setPreviewOpen: (state: Draft<UiState>, action: PayloadAction<boolean>) => {
            state.previewOpen = action.payload;
        },
        setMergeFiles: (state: Draft<UiState>, action: PayloadAction<{mainFile?: string; userFile?: string}>) => {
            state.mergeMainFile = action.payload.mainFile;
            state.mergeUserFile = action.payload.userFile;
        },
    },
});

export const {
    setView,
    setPage,
    setTheme,
    setPaneConfiguration,
    setEditorFontSize,
    setCurrentCommit,
    setOngoingChangesFile,
    setChangesBrowserView,
    setPreviewOpen,
    setMergeFiles,
} = uiSlice.actions;
export default uiSlice.reducer;
