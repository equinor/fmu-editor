import {useTheme} from "@mui/material";

import React from "react";

import {ChangesBrowser} from "@components/ChangesBrowser";
import {CommitBrowser} from "@components/CommitBrowser";
import {DiffEditor} from "@components/DiffEditor";
import {Editor} from "@components/Editor";
import {Explorer} from "@components/Explorer/explorer";
import {Merge} from "@components/Merge";
import {OngoingChangesBrowser} from "@components/OngoingChangesBrowser";
import {PageTabs} from "@components/PageTabs";
import {ResizablePanels} from "@components/ResizablePanels";
import {Toolbar} from "@components/Toolbar";

import {useAppSelector} from "@redux/hooks";

import {Page, View} from "@shared-types/ui";

import path from "path";

import "./main-window.css";

import {SingleFileChangesBrowser} from "../SingleFileChangesBrowser/single-file-changes-browser";

export const MainWindow: React.FC = () => {
    const theme = useTheme();

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);
    const files = useAppSelector(state => state.files);
    const page = useAppSelector(state => state.ui.page);
    const activeDiffFile = useAppSelector(state => state.files.activeDiffFile);
    const activeOngoingChangesDiffFile = useAppSelector(state => state.files.activeOngoingChangesDiffFile);
    const view = useAppSelector(state => state.ui.view);

    React.useEffect(() => {
        if (!files || files.activeFile === "") {
            document.title = "FMU Editor";
            return;
        }
        document.title = `${path.basename(files.activeFile)} - FMU Editor`;
    }, [files]);

    const makeContent = () => {
        if (view === View.OngoingChanges) {
            return (
                <ResizablePanels direction="horizontal" id="user-changes" minSizes={[300, 0]}>
                    <OngoingChangesBrowser />
                    {activeOngoingChangesDiffFile ? <DiffEditor /> : null}
                </ResizablePanels>
            );
        }

        if (view === View.SingleFileChanges) {
            return (
                <ResizablePanels direction="horizontal" id="single-file-changes" minSizes={[300, 0]}>
                    <SingleFileChangesBrowser />
                    {activeDiffFile ? <DiffEditor /> : null}
                </ResizablePanels>
            );
        }

        if (view === View.Merge) {
            return <Merge />;
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
                <PageTabs />
                <div className="InnerContentWrapper">{makeContent()}</div>
            </div>
            <Toolbar />
        </div>
    );
};
