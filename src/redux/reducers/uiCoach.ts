import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import electronStore from "@utils/electron-store";

import initialState from "@redux/initial-state";

import {UiCoachState} from "@shared-types/ui-coach";

export const uiCoachSlice = createSlice({
    name: "uiCoach",
    initialState: initialState.uiCoach,
    reducers: {
        setInitialConfigurationDone: (
            state: Draft<UiCoachState>,
            action: PayloadAction<boolean>
        ) => {
            electronStore.set(
                "uiCoach.initialConfigurationDone",
                action.payload
            );
            state.initialConfigurationDone = action.payload;
        },
    },
});

export const {setInitialConfigurationDone} = uiCoachSlice.actions;
export default uiCoachSlice.reducer;
