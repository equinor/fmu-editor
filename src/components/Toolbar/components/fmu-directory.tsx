import {Button} from "@mui/material";

import React from "react";
import {VscFolderActive} from "react-icons/vsc";

import {Directory} from "@utils/file-system/directory";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {selectFmuDirectory} from "@redux/thunks";

export const FmuDirectory: React.FC = () => {
    const fmuDirectoryPath = useAppSelector(state => state.files.fmuDirectoryPath);
    const fmuDirectory = new Directory("", fmuDirectoryPath);
    const dispatch = useAppDispatch();

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectoryPath, dispatch);
    };
    return (
        <Button
            id="status-bar-fmu-directory"
            size="small"
            onClick={handleOpenDirectoryClick}
            title="Current FMU directory. Click to change."
        >
            <VscFolderActive />
            <span>
                {fmuDirectoryPath === "" || !fmuDirectory.exists() ? (
                    <i>No FMU directory selected</i>
                ) : (
                    fmuDirectoryPath
                )}
            </span>
        </Button>
    );
};
