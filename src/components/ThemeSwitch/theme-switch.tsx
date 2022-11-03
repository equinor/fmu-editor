import {Brightness4, Brightness7} from "@mui/icons-material";
import {IconButton, Tooltip, useTheme} from "@mui/material";

import React from "react";

import {ColorModeContext} from "@src/App";

export const ThemeSwitch = () => {
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);

    return (
        <Tooltip
            title={`Switch to ${
                theme.palette.mode === "dark" ? "light" : "dark"
            } mode.`}
            placement="right"
            arrow
        >
            <IconButton onClick={colorMode.toggleColorMode} color="primary">
                {theme.palette.mode === "dark" ? (
                    <Brightness7 />
                ) : (
                    <Brightness4 />
                )}
            </IconButton>
        </Tooltip>
    );
};
