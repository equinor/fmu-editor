import {AppBar, Paper} from "@mui/material";

import React from "react";

export const ChangesBrowser: React.VFC = () => {
    return (
        <Paper elevation={4} className="ChangesBrowser">
            <AppBar position="static">6 file changes</AppBar>
        </Paper>
    );
};
