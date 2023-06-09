/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {ThemeProvider} from "@mui/material";
import {IpcService} from "@services/ipc-service";

import React from "react";

import {DialogProvider} from "@components/DialogProvider";
import {LoginDialog} from "@components/LoginDialog";
import {MainProcessDataProvider} from "@components/MainProcessDataProvider";
import {MainWindow} from "@components/MainWindow";
import {NotificationsProvider} from "@components/Notifications";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setTheme} from "@redux/reducers/ui";

import {Themes} from "@shared-types/ui";

import {SnackbarProvider} from "notistack";

import "./App.css";
import {Theme} from "./themes/theme";
import "./themes/theme.scss";

export const ColorModeContext = React.createContext({
    toggleColorMode: () => {},
});

const App = (): JSX.Element => {
    const dispatch = useAppDispatch();
    const [mode, setMode] = React.useState<"light" | "dark">(useAppSelector(state => state.ui.settings.theme));
    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode(prevMode => {
                    const newMode = prevMode === "light" ? "dark" : "light";
                    dispatch(setTheme(newMode as Themes));
                    return newMode;
                });
            },
        }),
        [dispatch]
    );

    React.useLayoutEffect(() => {
        document.body.setAttribute("data-theme", mode);
    }, [mode]);

    return (
        <SnackbarProvider
            preventDuplicate
            autoHideDuration={3000}
            maxSnack={3}
            anchorOrigin={{vertical: "bottom", horizontal: "right"}}
        >
            <MainProcessDataProvider>
                <ColorModeContext.Provider value={colorMode}>
                    <ThemeProvider theme={Theme(mode)}>
                        <NotificationsProvider>
                            <IpcService>
                                <MainWindow />
                                <LoginDialog />
                            </IpcService>
                        </NotificationsProvider>
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </MainProcessDataProvider>
        </SnackbarProvider>
    );
};

export default App;
