import {Button} from "@mui/material";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscFolder} from "react-icons/vsc";

import {Directory} from "@utils/file-system/directory";

import {useAppSelector} from "@redux/hooks";

import {NotificationType} from "@shared-types/notifications";

import path from "path";

export const WorkingDirectory: React.FC = () => {
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const workingDirectory = new Directory("", workingDirectoryPath);

    const handleOpenDirectoryClick = () => {
        if (workingDirectoryPath === "") {
            notificationsService.publishNotification({
                type: NotificationType.WARNING,
                message: "No working directory selected",
            });
        } else {
            notificationsService.publishNotification({
                type: NotificationType.INFORMATION,
                message: `'${workingDirectoryPath}' is your current working directory. It can be changed in the file explorer.`,
            });
        }
    };
    return (
        <Button id="status-bar-working-directory" size="small" onClick={handleOpenDirectoryClick} title="Current working directory.">
            <VscFolder />
            <span>
                {workingDirectoryPath === "" || !workingDirectory.exists() ? (
                    <i>No working directory selected</i>
                ) : (
                    path.basename(workingDirectoryPath)
                )}
            </span>
        </Button>
    );
};
