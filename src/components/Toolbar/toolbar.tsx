import {AppBar, Button, CssBaseline, Paper} from "@mui/material";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {selectFmuDirectory} from "@redux/thunks";

export const Toolbar: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const dispatch = useAppDispatch();

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectory, dispatch);
    };

    return (
        <Paper elevation={6}>
            <CssBaseline />
            <AppBar className="" position="static" color="primary" sx={{top: "auto", bottom: 0}} style={{padding: 4}}>
                <Button size="small" onClick={handleOpenDirectoryClick}>
                    {fmuDirectory}
                </Button>
            </AppBar>
        </Paper>
    );
};
