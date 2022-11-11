import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {useAppDispatch} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {NotificationType} from "@shared-types/notifications";

import os from "os";

type Context = {
    username: string;
    usernameError?: string;
};

const [useEnvironmentContext, EnvironmentContextProvider] = createGenericContext<Context>();

export const EnvironmentService: React.FC = props => {
    const [username, setUsername] = React.useState<string>("");
    const [usernameError, setUsernameError] = React.useState<string | undefined>(undefined);
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
    }, []);

    return <EnvironmentContextProvider value={{username}}>{props.children}</EnvironmentContextProvider>;
};

export const useEnvironment = (): Context => useEnvironmentContext();
