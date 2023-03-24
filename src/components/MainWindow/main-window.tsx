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

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setDiffModifiedFilePath} from "@redux/reducers/ui";

import {View} from "@shared-types/ui";

import path from "path";

import {Page} from "./components/page";
import {Pages} from "./components/pages";
import "./main-window.css";

import {SingleFileChangesBrowser} from "../SingleFileChangesBrowser/single-file-changes-browser";

export const MainWindow: React.FC = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);
    const files = useAppSelector(state => state.files);
    const originalRelativeFilePath = useAppSelector(state => state.ui.diff.originalRelativeFilePath);
    const view = useAppSelector(state => state.ui.view);

    React.useEffect(() => {
        if (view === View.Editor && files && files.activeFilePath !== "") {
            document.title = `${path.basename(files.activeFilePath)} - FMU Editor`;
            return;
        }
        if (view === View.SourceControl) {
            document.title = "Source Control - FMU Editor";
            return;
        }
        document.title = "FMU Editor";
    }, [files, view]);

    const handleOngoingChangesDiffEditorClose = () => {
        dispatch(setDiffModifiedFilePath({}));
    };

    const handleSourceControlDiffEditorClose = () => {
        dispatch(resetDiffFiles());
    };

    const handleSingleFileChangesDiffEditorClose = () => {
        dispatch(resetDiffFiles());
    };

    return (
        <div className="MainWindow" ref={mainWindowRef} style={{backgroundColor: theme.palette.background.default}}>
            <div className="ContentWrapper">
                <PageTabs />
                <div className="InnerContentWrapper">
                    <Pages activePage={view}>
                        <Page name={View.Editor} persistent>
                            <ResizablePanels direction="horizontal" id="file-explorer" minSizes={[250, 0]}>
                                <Explorer />
                                <Editor />
                            </ResizablePanels>
                        </Page>
                        <Page name={View.SourceControl} persistent>
                            <ResizablePanels direction="horizontal" id="source-control" minSizes={[300, 0]}>
                                <ChangesBrowser />
                                {originalRelativeFilePath ? (
                                    <DiffEditor onClose={handleSourceControlDiffEditorClose} />
                                ) : (
                                    <CommitBrowser />
                                )}
                            </ResizablePanels>
                        </Page>
                        <Page name={View.OngoingChanges}>
                            <ResizablePanels direction="horizontal" id="user-changes" minSizes={[300, 0]}>
                                <OngoingChangesBrowser />
                                {originalRelativeFilePath ? (
                                    <DiffEditor onClose={handleOngoingChangesDiffEditorClose} />
                                ) : null}
                            </ResizablePanels>
                        </Page>
                        <Page name={View.SingleFileChanges}>
                            <ResizablePanels direction="horizontal" id="single-file-changes" minSizes={[300, 0]}>
                                <SingleFileChangesBrowser />
                                {originalRelativeFilePath ? (
                                    <DiffEditor onClose={handleSingleFileChangesDiffEditorClose} />
                                ) : null}
                            </ResizablePanels>
                        </Page>
                        <Page name={View.Merge}>
                            <Pull />
                        </Page>
                    </Pages>
                </div>
            </div>
            <Toolbar />
        </div>
    );
};
