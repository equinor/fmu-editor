import { createTheme } from "@mui/material";
import palette from "./light.module.scss";


export const LightTheme = createTheme({
    palette: {
        primary: {
            main: palette.primaryColor,
        },
        secondary: {
            main: palette.secondaryColor,
        },
        background: {
            paper: palette.neutralColor_99,
            default: palette.neutralColor_99,
        }
    }
});
