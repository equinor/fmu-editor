import {Button} from "@mui/material";

import React from "react";
import {VscFolderActive} from "react-icons/vsc";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {selectFmuDirectory} from "@redux/thunks";

export const FmuDirectory: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const dispatch = useAppDispatch();

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectory, dispatch);
    };
    return (
        <Button size="small" onClick={handleOpenDirectoryClick} title="Current FMU directory. Click to change.">
            <VscFolderActive />
            <span>{fmuDirectory === "" ? <i>No FMU directory selected</i> : fmuDirectory}</span>
        </Button>
    );
};
