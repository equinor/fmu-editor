import {Button} from "@mui/material";
import {useEnvironment} from "@services/environment-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscGlobe} from "react-icons/vsc";

import {useAppDispatch} from "@redux/hooks";

import {Notification, NotificationType} from "@shared-types/notifications";

export const Environment: React.FC = () => {
    const environment = useEnvironment();

    const dispatch = useAppDispatch();

    const handleEnvironmentPathClick = () => {
        const notification: Notification =
            environment.environmentPath !== null
                ? {
                      type: NotificationType.INFORMATION,
                      message: `Read environment path '${environment.environmentPath}' from OS.`,
                  }
                : {
                      type: NotificationType.ERROR,
                      message: `Could not read environment path from OS. It seems you have not started the editor in a Komodo environment. File schemas will not be available. ${
                          environment.environmentPathError || ""
                      }`,
                  };

        notificationsService.publishNotification(notification);
    };

    return (
        <Button
            size="small"
            onClick={handleEnvironmentPathClick}
            title="Active environment"
            className={environment.environmentPath ? undefined : "error"}
        >
            <VscGlobe />
            <span>{environment.environmentPath || <i>No environment detected</i>}</span>
        </Button>
    );
};
