import {useTheme} from "@mui/material";

import React from "react";

import {ChangesBrowser} from "@components/ChangesBrowser";
import {CommitBrowser} from "@components/CommitBrowser";
import {DiffEditor} from "@components/DiffEditor";
import {Editor} from "@components/Editor";
import {Explorer} from "@components/Explorer/explorer";
import {OngoingChangesBrowser} from "@components/OngoingChangesBrowser";
import {PageTabs} from "@components/PageTabs";
import {Pull} from "@components/Pull";
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
    const diffFile = useAppSelector(state => state.ui.diffMainFile);
    const view = useAppSelector(state => state.ui.view);

    React.useEffect(() => {
        if (page === Page.Editor && files && files.activeFile !== "") {
            document.title = `${path.basename(files.activeFile)} - FMU Editor`;
            return;
        }
        if (page === Page.SourceControl) {
            document.title = "Source Control - FMU Editor";
            return;
        }
        document.title = "FMU Editor";
    }, [files, page]);

    const makeContent = () => {
        if (view === View.OngoingChanges) {
            return (
                <ResizablePanels direction="horizontal" id="user-changes" minSizes={[300, 0]}>
                    <OngoingChangesBrowser />
                    {diffFile ? <DiffEditor /> : null}
                </ResizablePanels>
            );
        }

        if (view === View.SingleFileChanges) {
            return (
                <ResizablePanels direction="horizontal" id="single-file-changes" minSizes={[300, 0]}>
                    <SingleFileChangesBrowser />
                    {diffFile ? <DiffEditor /> : null}
                </ResizablePanels>
            );
        }

        if (view === View.Merge) {
            return <Pull />;
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
                        {diffFile ? <DiffEditor /> : <CommitBrowser />}
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
