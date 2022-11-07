import {Paper, useTheme} from "@mui/material";

import React from "react";

import {Explorer} from "@components/Explorer/explorer";
import {ResizablePanels} from "@components/ResizablePanels";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppSelector} from "@redux/hooks";

import path from "path";

import "./main-window.css";

export const MainWindow: React.FC = () => {
    const theme = useTheme();

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);
    const files = useAppSelector(state => state.files);

    React.useEffect(() => {
        if (!files || files.activeFile === "") {
            document.title = "FMU Editor";
            return;
        }
        document.title = `${path.basename(files.activeFile)} - FMU Editor`;
    }, [files]);

    return (
        <div className="MainWindow" ref={mainWindowRef} style={{backgroundColor: theme.palette.background.default}}>
            <div className="ContentWrapper">
                <Paper elevation={6} className="TabMenu" sx={{borderRadius: 0}}>
                    <div className="GlobalSettings">
                        <ThemeSwitch />
                    </div>
                </Paper>
                <ResizablePanels direction="horizontal" id="file-explorer">
                    <Explorer />
                    <div className="Content" />
                </ResizablePanels>
            </div>
            <div className="Toolbar" />
        </div>
    );
};
