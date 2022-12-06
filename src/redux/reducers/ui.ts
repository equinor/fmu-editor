import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";

import initialState from "@redux/initial-state";

import {ICommitExtended} from "@shared-types/changelog";
import {Page, PaneConfiguration, Themes, UiState} from "@shared-types/ui";

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialState.ui,
    reducers: {
        setEditorMode: (state: Draft<UiState>, action: PayloadAction<Page>) => {
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
    },
});

export const {setEditorMode, setTheme, setPaneConfiguration, setEditorFontSize, setCurrentCommit} = uiSlice.actions;
export default uiSlice.reducer;
