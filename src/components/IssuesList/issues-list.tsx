import {monacoMainEditorInstances} from "@editors/monaco";
import {EditorType, GlobalSettings} from "@global/global-settings";
import {Error as ErrorIcon} from "@mui/icons-material";
import {Badge, Grid} from "@mui/material";

import React from "react";
import {monaco} from "react-monaco-editor";

import {Surface} from "@components/Surface";

import {useAppSelector} from "@redux/hooks";

import path from "path";

import {FileItem} from "./components/file-item";
import "./issues-list.css";

export type IssuesListProps = {
    visible: boolean;
};

const compareMarkers = (a: monaco.editor.IMarker, b: monaco.editor.IMarker): number => {
    if (a.startLineNumber === b.startLineNumber) {
        return a.startColumn - b.startColumn;
    }
    return a.startLineNumber - b.startLineNumber;
};

export type FileIssues = {
    fileUri: string;
    markers: monaco.editor.IMarker[];
};

const countIssues = (issues: FileIssues[]): number => {
    return issues.reduce((acc, el) => acc + el.markers.length, 0);
};

export const IssuesList: React.VFC<IssuesListProps> = props => {
    const [issues, setIssues] = React.useState<FileIssues[]>([]);

    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const monacoInstance = monacoMainEditorInstances.getMonacoInstance();
    const monacoEditorInstance = monacoMainEditorInstances.getMonacoEditorInstance();

    React.useEffect(() => {
        if (GlobalSettings.editorTypeForFileExtension(path.extname(activeFilePath)) !== EditorType.Monaco) {
            setIssues([]);
            return;
        }

        if (!monacoInstance) {
            setIssues([]);
            return;
        }

        const handleMarkersChange = () => {
            if (!monacoInstance || !monacoEditorInstance) {
                setIssues([]);
                return;
            }
            const newIssues = [];
            const markers = monacoInstance.editor
                .getModelMarkers({})
                .filter(marker => marker.resource.path === activeFilePath)
                .sort(compareMarkers);
            markers.forEach(marker => {
                const fileUri = marker.resource.path;
                const issue = newIssues.find(el => el.fileUri === fileUri);
                if (issue) {
                    issue.markers.push(marker);
                } else {
                    newIssues.push({fileUri, markers: [marker]});
                }
            });
            setIssues(newIssues);
        };

        monacoInstance.editor.onDidChangeMarkers(handleMarkersChange);
    }, [monacoInstance, monacoEditorInstance, activeFilePath]);

    const selectMarker = React.useCallback(
        (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, marker: monaco.editor.IMarker) => {
            if (monacoEditorInstance) {
                monacoEditorInstance.setSelection(
                    new monaco.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn)
                );

                monacoEditorInstance.revealLinesInCenterIfOutsideViewport(marker.startLineNumber, marker.endLineNumber);
            }
        },
        [monacoEditorInstance]
    );

    return (
        <div className="Issues" id="issues">
            <Surface elevation="raised" className="IssuesTitle">
                <Grid container columnSpacing={2} spacing={5} direction="row" alignItems="center">
                    <Grid item>
                        <Badge badgeContent={props.visible ? 0 : countIssues(issues)} color="warning">
                            <ErrorIcon color="action" />
                        </Badge>
                    </Grid>
                    <Grid item>Issues</Grid>
                </Grid>
            </Surface>
            <div className="IssuesContent" style={{display: props.visible ? "none" : "block"}}>
                {issues.map(issue => (
                    <FileItem key={issue.fileUri} issues={issue} onSelectMarker={selectMarker} />
                ))}
            </div>
        </div>
    );
};
