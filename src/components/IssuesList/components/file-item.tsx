import {Chip, IconButton, useTheme} from "@mui/material";

import React from "react";
import {VscChevronDown, VscChevronRight, VscError, VscInfo, VscLightbulb, VscWarning} from "react-icons/vsc";
import {monaco} from "react-monaco-editor";

import {getFileIcon} from "@src/file-icons";

import {useAppSelector} from "@redux/hooks";

import path from "path";
import {v4} from "uuid";

import {FileIssues} from "../issues-list";

export type FileComponentProps = {
    issues: FileIssues;
    onSelectMarker: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, marker: monaco.editor.IMarker) => void;
};

export const FileItem: React.VFC<FileComponentProps> = props => {
    const [expanded, setExpanded] = React.useState(true);

    const theme = useTheme();
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    const relativeDirName = path.dirname(path.relative(workingDirectoryPath, props.issues.fileUri));
    const baseName = path.basename(props.issues.fileUri);

    return (
        <div className="IssuesFile" key={props.issues.fileUri}>
            <div className="IssuesFileTitle" onClick={() => setExpanded(prev => !prev)}>
                <IconButton size="small" color="primary">
                    {expanded ? <VscChevronDown /> : <VscChevronRight />}
                </IconButton>
                {getFileIcon(props.issues.fileUri)}
                <span className="IssuesFileName">{baseName}</span>
                <span className="IssuesFilePath">{relativeDirName}</span>
                <Chip label={props.issues.markers.length} size="small" />
            </div>
            <div className="IssuesFileContent" style={{display: expanded ? "block" : "none"}}>
                {props.issues.markers.map(marker => (
                    <a href="#" className="Issue" onClick={e => props.onSelectMarker(e, marker)} key={v4()}>
                        {marker.severity === monaco.MarkerSeverity.Error ? (
                            <VscError color={theme.palette.error.main} size={16} />
                        ) : marker.severity === monaco.MarkerSeverity.Warning ? (
                            <VscWarning color={theme.palette.warning.main} size={16} />
                        ) : marker.severity === monaco.MarkerSeverity.Info ? (
                            <VscInfo color={theme.palette.info.main} size={16} />
                        ) : (
                            <VscLightbulb color={theme.palette.secondary.main} size={16} />
                        )}{" "}
                        {marker.message}
                        <span className="IssuePosition">
                            [Ln {marker.startLineNumber}, Col {marker.startColumn}]
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};
