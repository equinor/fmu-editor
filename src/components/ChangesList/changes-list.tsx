import {Add, Edit, Remove} from "@mui/icons-material";
import {Button} from "@mui/material";

import React from "react";

import {OverflowEllipsis} from "@components/OverflowEllipsis";
import {EllipsisPosition} from "@components/OverflowEllipsis/overflow-ellipsis";

import {useAppSelector} from "@redux/hooks";

import {FileChange, FileChangeOrigin, FileChangeType} from "@shared-types/file-changes";

export enum ChangesListMode {
    Staging = "STAGING",
    Unstaging = "UNSTAGING",
}

export type ChangesListProps = {
    mode: ChangesListMode;
    fileChanges: FileChange[];
    onFileSelect: (relativePath: string, origin: FileChangeOrigin) => void;
    onFileStage?: (relativePath: string) => void;
    onFileUnstage?: (relativePath: string) => void;
    onResolveConflicts?: (relativePath: string) => void;
};

export const ChangesList: React.FC<ChangesListProps> = props => {
    const diffMainFile = useAppSelector(state => state.ui.diffMainFile);
    const diffUserFile = useAppSelector(state => state.ui.diffUserFile);

    const handleStageOrUnstageChange = (e: React.MouseEvent<HTMLButtonElement>, relativePath: string) => {
        e.stopPropagation();
        if (props.mode === ChangesListMode.Staging && props.onFileStage) {
            props.onFileStage(relativePath);
        } else if (props.mode === ChangesListMode.Unstaging && props.onFileUnstage) {
            props.onFileUnstage(relativePath);
        }
    };

    const handleResolveConflicts = (e: React.MouseEvent<HTMLButtonElement>, relativePath: string) => {
        e.stopPropagation();
        if (props.onResolveConflicts) {
            props.onResolveConflicts(relativePath);
        }
    };

    return (
        <div className="ChangesBrowserList">
            {props.fileChanges.map(fileChange => (
                <div
                    className={`ChangesBrowserListItem${
                        (fileChange.type === FileChangeType.MODIFIED && fileChange.relativePath === diffMainFile) ||
                        fileChange.relativePath === diffUserFile
                            ? " ChangesBrowserListItemSelected"
                            : ""
                    }`}
                    key={fileChange.relativePath}
                    onClick={() => props.onFileSelect(fileChange.relativePath, fileChange.origin)}
                >
                    {fileChange.type === FileChangeType.MODIFIED && <Edit color="warning" fontSize="small" />}
                    {fileChange.type === FileChangeType.ADDED && <Add color="success" fontSize="small" />}
                    {fileChange.type === FileChangeType.DELETED && <Remove color="error" fontSize="small" />}
                    <OverflowEllipsis
                        ellipsisPosition={EllipsisPosition.LEFT}
                        text={fileChange.relativePath}
                        showFullTextAsTitle
                    />
                    {fileChange.origin !== FileChangeOrigin.BOTH ? (
                        <Button
                            variant="text"
                            onClick={e => handleStageOrUnstageChange(e, fileChange.relativePath)}
                            size="small"
                        >
                            {props.mode === ChangesListMode.Staging ? "Stage File" : "Unstage File"}
                        </Button>
                    ) : (
                        <Button
                            variant="text"
                            onClick={e => handleResolveConflicts(e, fileChange.relativePath)}
                            size="small"
                            color="error"
                        >
                            Resolve
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
};
