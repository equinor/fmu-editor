import {useIsSignedIn} from "@hooks/useIsMicrosoftUserSignedIn";
import {Login as MicrosoftLogin} from "@microsoft/mgt-react";

import React from "react";

import {NotificationType} from "@components/Notifications";

import {useAppDispatch} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

export const Login: React.VFC = () => {
    const dispatch = useAppDispatch();
    const loggedIn = useIsSignedIn();

    const handleLoginCompleted = () => {
        dispatch(
            addNotification({
                type: NotificationType.SUCCESS,
                message: `Logged in.`,
            })
        );
    };

    const handleLoginFailed = () => {
        dispatch(
            addNotification({
                type: NotificationType.ERROR,
                message: `Logged failed.`,
            })
        );
    };

    if (loggedIn[0]) {
        return null;
    }

    return <MicrosoftLogin loginCompleted={handleLoginCompleted} loginFailed={handleLoginFailed} />;
};
