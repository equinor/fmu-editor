import {Button} from "@mui/material";
import {useEnvironment} from "@services/environment-service";

import React from "react";
import {VscAccount, VscFolderActive, VscGlobe} from "react-icons/vsc";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";
import {selectFmuDirectory} from "@redux/thunks";

import {Notification, NotificationType} from "@shared-types/notifications";

import "./toolbar.css";

export const Toolbar: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const environment = useEnvironment();

    const dispatch = useAppDispatch();

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectory, dispatch);
    };

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

    const handleEnvironmentPathClick = () => {
        const notification: Notification =
            environment.environmentPath !== null
                ? {
                      type: NotificationType.INFORMATION,
                      message: `Read environment path '${environment.environmentPath}' from OS.`,
                  }
                : {
                      type: NotificationType.ERROR,
                      message: `Could not read environment path from OS. ${environment.environmentPathError || ""}`,
                  };

        dispatch(addNotification(notification));
    };

    return (
        <div className="Toolbar">
            <Button size="small" onClick={handleOpenDirectoryClick} title="Current FMU directory. Click to change.">
                <VscFolderActive />
                {fmuDirectory === "" ? <i>No FMU directory selected</i> : fmuDirectory}
            </Button>
            <Button size="small" onClick={handleUsernameClick} title="Current user. Click for more information.">
                <VscAccount />
                {environment.username}
            </Button>
            <Button size="small" onClick={handleEnvironmentPathClick} title="Active environment">
                <VscGlobe />
                {environment.environmentPath || <i>No environment detected</i>}
            </Button>
        </div>
    );
};
