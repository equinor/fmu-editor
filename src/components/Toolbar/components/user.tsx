import {Button} from "@mui/material";
import {useEnvironment} from "@services/environment-service";

import React from "react";
import {VscAccount} from "react-icons/vsc";

import {useAppDispatch} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {Notification, NotificationType} from "@shared-types/notifications";

export const User: React.FC = () => {
    const environment = useEnvironment();

    const dispatch = useAppDispatch();

    const handleUsernameClick = () => {
        const notification: Notification = !environment.usernameError
            ? {
                  type: NotificationType.INFORMATION,
                  message: `Read username '${environment.username}' from OS.`,
              }
            : {
                  type: NotificationType.ERROR,
                  message: `Could not read username from OS. ${environment.usernameError || ""}`,
              };

        dispatch(addNotification(notification));
    };

    return (
        <Button size="small" onClick={handleUsernameClick} title="Current user. Click for more information.">
            <VscAccount />
            <span>{environment.username}</span>
        </Button>
    );
};
