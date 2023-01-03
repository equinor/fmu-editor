/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {ThemeProvider} from "@mui/material";
import {ChangelogWatcherService} from "@services/changelog-service";
import {EnvironmentService} from "@services/environment-service";
import {FileManagerService} from "@services/file-manager";
import {IpcService} from "@services/ipc-service";

import React from "react";

import {GlobalSettingsProvider} from "@components/GlobalSettingsProvider";
import {LoginDialog} from "@components/LoginDialog";
import {MainProcessDataProvider} from "@components/MainProcessDataProvider";
import {MainWindow} from "@components/MainWindow";
import {NotificationsProvider} from "@components/Notifications";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setTheme} from "@redux/reducers/ui";

import {Themes} from "@shared-types/ui";

import "./App.css";
import {FileChangesWatcherService} from "./services/file-changes-service";
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
        <GlobalSettingsProvider>
            <MainProcessDataProvider>
                <ColorModeContext.Provider value={colorMode}>
                    <ThemeProvider theme={Theme(mode)}>
                        <NotificationsProvider>
                            <EnvironmentService>
                                <FileManagerService>
                                    <ChangelogWatcherService>
                                        <FileChangesWatcherService>
                                            <IpcService>
                                                <MainWindow />
                                                <LoginDialog />
                                            </IpcService>
                                        </FileChangesWatcherService>
                                    </ChangelogWatcherService>
                                </FileManagerService>
                            </EnvironmentService>
                        </NotificationsProvider>
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </MainProcessDataProvider>
        </GlobalSettingsProvider>
    );
};

export default App;
