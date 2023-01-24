import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {useAppDispatch} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {NotificationType} from "@shared-types/notifications";

import {execSync} from "child_process";
import os from "os";

type Context = {
    username: string | null;
    usernameError?: string;
    environmentPath: string | null;
    environmentPathError?: string;
};

const [useEnvironmentContext, EnvironmentContextProvider] = createGenericContext<Context>();

export const EnvironmentService: React.FC = props => {
    const [username, setUsername] = React.useState<string | null>(null);
    const [usernameError, setUsernameError] = React.useState<string | undefined>(undefined);
    const [environmentPath, setEnvironmentPath] = React.useState<string | null>(null);
    const [environmentPathError, setEnvironmentPathError] = React.useState<string | undefined>(undefined);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        try {
            setUsername(os.userInfo().username);
        } catch (e) {
            setUsernameError(`${e}`);
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: `Could not read username from OS. ${e}`,
                })
            );
        }
    }, [setUsernameError, dispatch]);

    React.useEffect(() => {
        try {
            const path = execSync("echo $VIRTUAL_ENV").toString().trim();
            setEnvironmentPath(path === "" ? null : path);
        } catch (e) {
            setEnvironmentPathError(`${e}`);
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: `Could not detect Komodo environment. JSON schema files cannot be loaded. ${e}`,
                })
            );
        }
    }, [setEnvironmentPathError, dispatch]);

    return (
        <EnvironmentContextProvider value={{username, usernameError, environmentPath, environmentPathError}}>
            {props.children}
        </EnvironmentContextProvider>
    );
};

export const useEnvironment = (): Context => useEnvironmentContext();
