import {useTheme} from "@mui/material";

import React from "react";

import {ChangesBrowser} from "@components/ChangesBrowser";
import {DiffEditor} from "@components/DiffEditor";
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
    const page = useAppSelector(state => state.ui.page);

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
                {page === "editor" && (
                    <ResizablePanels direction="horizontal" id="file-explorer">
                        <Explorer />
                        <Editor />
                    </ResizablePanels>
                )}
                {page === "source-control" && (
                    <ResizablePanels direction="horizontal" id="source-control">
                        <ChangesBrowser />
                        <DiffEditor />
                    </ResizablePanels>
                )}
            </div>
            <Toolbar />
        </div>
    );
};
