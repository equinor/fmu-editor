import {Button} from "@mui/material";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {selectFmuDirectory} from "@redux/thunks";

import FmuLogo from "@assets/fmu-logo.svg";

import "./toolbar.css";

export const Toolbar: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const dispatch = useAppDispatch();

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectory, dispatch);
    };

    return (
        <div className="Toolbar">
            <Button size="small" onClick={handleOpenDirectoryClick}>
                <img src={FmuLogo} alt="FMU Logo" className="ToolbarFmuLogo" />
                {fmuDirectory}
            </Button>
        </div>
    );
};
