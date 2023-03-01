import {Button} from "@mui/material";

import React from "react";
import {VscFolderActive} from "react-icons/vsc";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {selectFmuDirectory} from "@redux/thunks";

export const FmuDirectory: React.FC = () => {
    const fmuDirectoryPath = useAppSelector(state => state.files.fmuDirectoryPath);
    const dispatch = useAppDispatch();

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectoryPath, dispatch);
    };
    return (
        <Button size="small" onClick={handleOpenDirectoryClick} title="Current FMU directory. Click to change.">
            <VscFolderActive />
            <span>{fmuDirectoryPath === "" ? <i>No FMU directory selected</i> : fmuDirectoryPath}</span>
        </Button>
    );
};
