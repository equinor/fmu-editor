import {createTheme} from "@mui/material";

import {uncapitalize, trimPx} from "@utils/string";

import palette from "./theme.module.scss";

export const modePalette = (mode: "light" | "dark") => {
    return Object.fromEntries(
        Object.entries(palette)
            .filter(([key]) => key.includes(mode))
            .map(([key, value]) => [uncapitalize(key.replace(mode, "")), value])
    );
};

export const Theme = (mode: "light" | "dark") => {
    const themePalette = modePalette(mode);
    return createTheme({
        palette: {
            mode,
            primary: {
                main: themePalette.primary,
                contrastText: themePalette.textOnPrimary,
            },
            secondary: {
                main: themePalette.secondary,
                contrastText: themePalette.textOnPrimary,
            },
            background: {
                paper: themePalette.backgroundLight,
                default: themePalette.backgroundColor,
            },
            error: {
                main: themePalette.danger,
                light: themePalette.dangerHover,
                dark: themePalette.dangerHighlight,
            },
            warning: {
                main: themePalette.warning,
                light: themePalette.warningHover,
                dark: themePalette.warningHighlight,
            },
            text: {
                primary: themePalette.textColor,
                secondary: themePalette.textSecondary,
                disabled: themePalette.textTertiary,
            },
            divider: themePalette.secondary,
        },
        shape: {
            borderRadius: trimPx(palette.borderRadius),
        },
    });
};
