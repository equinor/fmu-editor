import {useTheme} from "@mui/material";

import React from "react";

import {PythonInterpreter} from "./components/python-interpreter";
import {WebvizSchema} from "./components/webviz-schema";
import {WebvizTheme} from "./components/webviz-theme";
import "./preferences.css";

export const Preferences: React.FC = () => {
    const theme = useTheme();
    return (
        <div
            className="Preferences"
            style={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
            }}
        >
            <div className="Preferences__Category">Python</div>
            <div className="Preferences__CategoryContent">
                <PythonInterpreter />
            </div>
            <div className="Preferences__Category">Webviz</div>
            <div className="Preferences__CategoryContent">
                <WebvizSchema />
                <WebvizTheme />
            </div>
        </div>
    );
};
