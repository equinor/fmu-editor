import {createTheme} from "@mui/material";

import palette from "./theme.module.scss";

console.log(palette);

export const LightTheme = createTheme({
    palette: {
        primary: {
            main: palette.lightPrimary,
        },
        secondary: {
            main: palette.lightSecondary,
        },
        background: {
            paper: palette.lightBackgroundLight,
            default: palette.lightBackgroundColor,
        },
    },
});
