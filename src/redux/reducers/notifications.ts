import {Draft, PayloadAction, createSlice} from "@reduxjs/toolkit";

import initialState from "@redux/initial-state";

import {Notification, NotificationsState} from "@shared-types/notifications";

export const notificationsSlice = createSlice({
    name: "notifications",
    initialState: initialState.notifications,
    reducers: {
        addNotification: (
            state: Draft<NotificationsState>,
            action: PayloadAction<Notification>
        ) => {
            state.notifications.push(action.payload);
        },
        clearNotifications: (state: Draft<NotificationsState>) => {
            state.notifications = [];
        },
    },
});

export const {addNotification, clearNotifications} = notificationsSlice.actions;
export default notificationsSlice.reducer;
