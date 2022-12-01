import {Button, LinearProgress} from "@mui/material";
import {useEnvironment} from "@services/environment-service";
import {useFileManager} from "@services/file-manager";

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
    const [progress, setProgress] = React.useState<number>(0);

    const dispatch = useAppDispatch();
    const fileManager = useFileManager();

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
                      message: `Could not read environment path from OS. It seems you have not started the editor in a Komodo environment. File schemas will not be available. ${
                          environment.environmentPathError || ""
                      }`,
                  };

        dispatch(addNotification(notification));
    };

    React.useEffect(() => {
        const adjustProgress = (e: Event) => {
            // @ts-ignore
            setProgress(e.detail.progress as number);
        };

        document.addEventListener("copyUserDirectoryProgress", adjustProgress);

        return () => {
            document.removeEventListener("copyUserDirectoryProgress", adjustProgress);
        };
    }, []);

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
            <Button
                size="small"
                onClick={handleEnvironmentPathClick}
                title="Active environment"
                className={environment.environmentPath ? undefined : "error"}
            >
                <VscGlobe />
                {environment.environmentPath || <i>No environment detected</i>}
            </Button>
            <LinearProgress variant="determinate" value={progress} />
            <Button onClick={() => fileManager.copyUserDirectory()} title="Copy user directory to FMU directory">
                Copy user directory
            </Button>
        </div>
    );
};
