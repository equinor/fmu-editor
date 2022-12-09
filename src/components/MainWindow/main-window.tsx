import {useTheme} from "@mui/material";

import React from "react";

import {ChangesBrowser} from "@components/ChangesBrowser";
import {CommitBrowser} from "@components/CommitBrowser";
import {DiffEditor} from "@components/DiffEditor";
import {Editor} from "@components/Editor";
import {Explorer} from "@components/Explorer/explorer";
import {ResizablePanels} from "@components/ResizablePanels";
import {Toolbar} from "@components/Toolbar";
import {UserChangesBrowser} from "@components/UserChangesBrowser";
import {Views} from "@components/Views";

import {useAppSelector} from "@redux/hooks";

import {Page} from "@shared-types/ui";

import path from "path";

import "./main-window.css";

export const MainWindow: React.FC = () => {
    const theme = useTheme();

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);
    const files = useAppSelector(state => state.files);
    const page = useAppSelector(state => state.ui.page);
    const activeDiffFile = useAppSelector(state => state.files.activeDiffFile);
    const userChangesFile = useAppSelector(state => state.ui.userChangesFile);

    React.useEffect(() => {
        if (!files || files.activeFile === "") {
            document.title = "FMU Editor";
            return;
        }
        document.title = `${path.basename(files.activeFile)} - FMU Editor`;
    }, [files]);

    const makeContent = () => {
        if (userChangesFile !== undefined && activeDiffFile) {
            return (
                <ResizablePanels direction="horizontal" id="user-changes" minSizes={[300, 0]}>
                    <UserChangesBrowser />
                    {activeDiffFile ? <DiffEditor /> : null}
                </ResizablePanels>
            );
        }
        return (
            <>
                {page === Page.Editor && (
                    <ResizablePanels direction="horizontal" id="file-explorer" minSizes={[250, 0]}>
                        <Explorer />
                        <Editor />
                    </ResizablePanels>
                )}
                {page === Page.SourceControl && (
                    <ResizablePanels direction="horizontal" id="source-control" minSizes={[300, 0]}>
                        <ChangesBrowser />
                        {activeDiffFile ? <DiffEditor /> : <CommitBrowser />}
                    </ResizablePanels>
                )}
            </>
        );
    };

    return (
        <div className="MainWindow" ref={mainWindowRef} style={{backgroundColor: theme.palette.background.default}}>
            <div className="ContentWrapper">
                <Views />
                <div className="InnerContentWrapper">{makeContent()}</div>
            </div>
            <Toolbar />
        </div>
    );
};
