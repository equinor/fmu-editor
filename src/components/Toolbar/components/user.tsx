import {Button} from "@mui/material";
import {useEnvironment} from "@services/environment-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscAccount} from "react-icons/vsc";

import {Notification, NotificationType} from "@shared-types/notifications";

export const User: React.FC = () => {
    const environment = useEnvironment();

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

        notificationsService.publishNotification(notification);
    };

    return (
        <Button size="small" onClick={handleUsernameClick} title="Current user. Click for more information.">
            <VscAccount />
            <span>{environment.username}</span>
        </Button>
    );
};
