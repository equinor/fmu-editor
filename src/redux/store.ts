import {Middleware, configureStore} from "@reduxjs/toolkit";

import {createLogger} from "redux-logger";

import {filesSlice} from "./reducers/files";
import {notificationsSlice} from "./reducers/notifications";
import {preferencesSlice} from "./reducers/preferences";
import {uiSlice} from "./reducers/ui";
import {uiCoachSlice} from "./reducers/uiCoach";

const middlewares: Middleware[] = [];

if (process.env.NODE_ENV === `development`) {
    const reduxLoggerMiddleware = createLogger({
        predicate: () => true,
        collapsed: (_, __, logEntry) => !logEntry?.error,
    });

    middlewares.push(reduxLoggerMiddleware);
}

const store = configureStore({
    reducer: {
        ui: uiSlice.reducer,
        preferences: preferencesSlice.reducer,
        uiCoach: uiCoachSlice.reducer,
        files: filesSlice.reducer,
        notifications: notificationsSlice.reducer,
    },
    middleware: getDefaultMiddleware => [
        ...getDefaultMiddleware().concat(middlewares),
    ],
});

// eslint-disable-next-line no-undef
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
