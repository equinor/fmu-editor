import {AppBar, CssBaseline, Paper, Typography} from "@mui/material";

import React from "react";

import {useAppSelector} from "@redux/hooks";

export const Toolbar: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);

    return (
        <Paper elevation={6}>
            <CssBaseline />
            <AppBar position="static" color="primary" sx={{top: "auto", bottom: 0}} style={{padding: 4}}>
                <Typography variant="body2">{fmuDirectory}</Typography>
            </AppBar>
        </Paper>
    );
};
