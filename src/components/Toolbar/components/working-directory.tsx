import {Button} from "@mui/material";

import React from "react";
import {VscFolder} from "react-icons/vsc";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {NotificationType} from "@shared-types/notifications";

import path from "path";

export const WorkingDirectory: React.FC = () => {
    const workingDirectory = useAppSelector(state => state.files.directory);

    const dispatch = useAppDispatch();

    const handleOpenDirectoryClick = () => {
        dispatch(
            addNotification({
                type: NotificationType.INFORMATION,
                message: `'${workingDirectory}' is your current working directory. It can be changed in the file explorer.`,
            })
        );
    };
    return (
        <Button size="small" onClick={handleOpenDirectoryClick} title="Current working directory.">
            <VscFolder />
            <span>
                {workingDirectory === "" ? <i>No working directory selected</i> : path.basename(workingDirectory)}
            </span>
        </Button>
    );
};
