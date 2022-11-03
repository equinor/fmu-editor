import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";

import initialState from "@redux/initial-state";

import {PreferencesState} from "@shared-types/preferences";

export const preferencesSlice = createSlice({
    name: "preferences",
    initialState: initialState.preferences,
    reducers: {
        setPathToPythonInterpreter: (
            state: Draft<PreferencesState>,
            action: PayloadAction<string>
        ) => {
            electronStore.set(
                "preferences.pathToPythonInterpreter",
                action.payload
            );
            state.pathToPythonInterpreter = action.payload;
        },
        setPathToYamlSchemaFile: (
            state: Draft<PreferencesState>,
            action: PayloadAction<string>
        ) => {
            electronStore.set(
                "preferences.pathToYamlSchemaFile",
                action.payload
            );
            state.pathToYamlSchemaFile = action.payload;
        },
        setWebvizTheme: (
            state: Draft<PreferencesState>,
            action: PayloadAction<string>
        ) => {
            electronStore.set("preferences.webvizTheme", action.payload);
            state.webvizTheme = action.payload;
        },
    },
});

export const {
    setPathToPythonInterpreter,
    setPathToYamlSchemaFile,
    setWebvizTheme,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
