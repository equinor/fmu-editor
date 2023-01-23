import {Error as ErrorIcon} from "@mui/icons-material";
import {Badge, Grid} from "@mui/material";

import React from "react";
import {monaco} from "react-monaco-editor";

import {Surface} from "@components/Surface";

import {FileItem} from "./components/file-item";
import "./issues-list.css";

export type IssuesListProps = {
    monacoEditorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>;
    monacoRef: React.RefObject<typeof monaco | null>;
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

    const handleMarkersChange = React.useCallback(() => {
        if (!props.monacoRef.current || !props.monacoEditorRef.current) {
            return;
        }
        const newIssues = [];
        const markers = props.monacoRef.current.editor.getModelMarkers({}).sort(compareMarkers);
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
    }, [props.monacoRef, props.monacoEditorRef]);

    React.useEffect(() => {
        if (!props.monacoRef) {
            return;
        }
        props.monacoRef.current.editor.onDidChangeMarkers(handleMarkersChange);
    }, [props.monacoRef, handleMarkersChange]);

    const selectMarker = React.useCallback(
        (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, marker: monaco.editor.IMarker) => {
            if (props.monacoEditorRef.current) {
                props.monacoEditorRef.current.setSelection(
                    new monaco.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn)
                );

                props.monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(
                    marker.startLineNumber,
                    marker.endLineNumber
                );
            }
        },
        [props.monacoEditorRef]
    );

    return (
        <div className="Issues">
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
