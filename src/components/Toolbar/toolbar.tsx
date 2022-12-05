import {Button, LinearProgress} from "@mui/material";
import {useEnvironment} from "@services/environment-service";
import {useFileManager} from "@services/file-manager";

import React from "react";
import {VscAccount, VscFolderActive, VscGlobe, VscPerson} from "react-icons/vsc";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";
import {selectFmuDirectory} from "@redux/thunks";

import {Notification, NotificationType} from "@shared-types/notifications";

import path from "path";

import "./toolbar.css";

export const Toolbar: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const environment = useEnvironment();
    const [progress, setProgress] = React.useState<number>(100);

    const dispatch = useAppDispatch();
    const {fileManager, copyUserDirectory} = useFileManager();

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

    const handleUserDirectoryClick = () => {
        if (fileManager.userDirectoryExists()) {
            const notification: Notification = {
                type: NotificationType.INFORMATION,
                message: `User directory up to date and located at '${fileManager.userDirectory()}'.`,
            };
            dispatch(addNotification(notification));
            return;
        }
        dispatch(
            addNotification({
                type: NotificationType.INFORMATION,
                message: `You don't have a copy of the working directory (${fileManager.getCurrentDirectory()}). Create it now? Note: this might take a couple of minutes.`,
                action: {
                    label: "Create",
                    action: () => {
                        copyUserDirectory();
                        setProgress(0);
                    },
                },
            })
        );
    };

    React.useEffect(() => {
        const adjustProgress = (e: Event) => {
            // @ts-ignore
            setProgress(Math.round(e.detail.progress * 100) as number);
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
            <Button
                size="small"
                onClick={handleUserDirectoryClick}
                title={
                    fileManager.userDirectoryExists() ? "Current user directory" : "Click here to create user directory"
                }
            >
                <VscPerson />
                {progress < 100 ? (
                    <i>Copying...</i>
                ) : fileManager.userDirectoryExists() ? (
                    path.relative(fileManager.getFmuDirectory(), fileManager.userDirectory())
                ) : (
                    <i>User directory no created yet</i>
                )}
            </Button>
            <div style={{width: 50, display: progress < 100 ? "block" : "none"}}>
                <LinearProgress color="inherit" variant="determinate" value={progress} />
            </div>
        </div>
    );
};
