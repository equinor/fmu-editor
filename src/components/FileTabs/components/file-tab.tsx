import {useFileChanges} from "@hooks/useFileChanges";
import {Close} from "@mui/icons-material";
import {useTheme} from "@mui/material";

import React from "react";
import {VscCircleFilled} from "react-icons/vsc";

import {generateHashCode} from "@utils/hash";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {closeFile, setPermanentOpen} from "@redux/reducers/files";

import {FileChangeOrigin} from "@shared-types/file-changes";

import path from "path";

import "./file-tab.css";

export type FileTabProps = {
    filePath: string;
    onSelect: (filePath: string) => void;
};

export const FileTab: React.FC<FileTabProps> = props => {
    const [filename, setFilename] = React.useState<string>("");
    const [active, setActive] = React.useState<boolean>(false);
    const [modified, setModified] = React.useState<boolean>(false);
    const [uncommitted, setUncommitted] = React.useState<boolean>(false);

    const theme = useTheme();
    const dispatch = useAppDispatch();
    const file = useAppSelector(state => state.files.files.find(el => el.filePath === props.filePath));
    const directory = useAppSelector(state => state.files.directory);
    const activeFilePath = useAppSelector(state => state.files.activeFile);
    const fileChanges = useFileChanges(FileChangeOrigin.USER);

    React.useEffect(() => {
        if (!file) {
            return;
        }
        setFilename(path.basename(file.filePath));
        setModified(generateHashCode(file.editorValue) !== file.hash || !file.associatedWithFile);
    }, [file]);

    React.useEffect(() => {
        setUncommitted(
            fileChanges.some(change => change.relativePath === path.relative(directory, file?.filePath || ""))
        );
    }, [fileChanges, file?.filePath, directory]);

    React.useEffect(() => {
        setActive(props.filePath === activeFilePath);
    }, [activeFilePath, props.filePath]);

    const handleClick = () => {
        props.onSelect(props.filePath);
    };

    const handleCloseEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(closeFile(props.filePath));
    };

    const handleDoubleClick = () => {
        dispatch(setPermanentOpen(props.filePath));
    };

    return (
        <div
            className={`FileTab${active ? " FileTab--active" : ""}${modified ? " FileTab--modified" : ""}`}
            onClick={() => handleClick()}
            onDoubleClick={() => handleDoubleClick()}
            title={props.filePath}
        >
            {file.permanentOpen ? filename : <i>{filename}</i>}
            {uncommitted && (
                <span title="Uncommitted changes">
                    <VscCircleFilled fontSize="inherit" style={{color: theme.palette.info.light}} />
                </span>
            )}
            <div className="FileTab__CloseButton" onClick={e => handleCloseEvent(e)}>
                <Close fontSize="inherit" />
            </div>
        </div>
    );
};
