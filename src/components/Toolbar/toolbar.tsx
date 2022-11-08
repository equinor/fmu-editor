import {AppBar} from "@mui/material";

import React from "react";

import {useAppSelector} from "@redux/hooks";

export const Toolbar: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);

    return (
        <AppBar position="static" color="primary" sx={{top: "auto", bottom: 0}}>
            {fmuDirectory}
        </AppBar>
    );
};
