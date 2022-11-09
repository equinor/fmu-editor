/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {ThemeProvider, createTheme} from "@mui/material";
import {IpcService} from "@services/ipc-service";
import {PluginParserService} from "@services/plugin-parser";
import {YamlParserService} from "@services/yaml-parser";

import React from "react";

import {GetStartedDialog} from "@components/GetStartedDialog";
import {MainProcessDataProvider} from "@components/MainProcessDataProvider";
import {MainWindow} from "@components/MainWindow";
import {NotificationsProvider} from "@components/Notifications";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setTheme} from "@redux/reducers/ui";

import {Themes} from "@shared-types/ui";

import "./App.css";

export const ColorModeContext = React.createContext({
    toggleColorMode: () => {},
});

function App(): JSX.Element {
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

    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode]
    );

    return (
        <div className={mode === "light" ? "LightMode" : "DarkMode"}>
            <MainProcessDataProvider>
                <ColorModeContext.Provider value={colorMode}>
                    <ThemeProvider theme={theme}>
                        <NotificationsProvider>
                            <YamlParserService>
                                <PluginParserService>
                                    <IpcService>
                                        <GetStartedDialog />
                                        <MainWindow />
                                    </IpcService>
                                </PluginParserService>
                            </YamlParserService>
                        </NotificationsProvider>
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </MainProcessDataProvider>
        </div>
    );
}

export default App;
