import {useTheme} from "@mui/material";

import React from "react";

import {Editor} from "@components/Editor";
import {Explorer} from "@components/Explorer/explorer";
import {ResizablePanels} from "@components/ResizablePanels";
import {Toolbar} from "@components/Toolbar";
import {Views} from "@components/Views";

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
                <Views />
                <ResizablePanels direction="horizontal" id="file-explorer">
                    <Explorer />
                    <Editor />
                </ResizablePanels>
            </div>
            <Toolbar />
        </div>
    );
};
