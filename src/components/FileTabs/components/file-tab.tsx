import {Close} from "@mui/icons-material";
import {useTheme} from "@mui/material";
import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";
import {VscCircleFilled} from "react-icons/vsc";

import {generateHashCode} from "@utils/hash";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {closeFile} from "@redux/reducers/files";

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
    const fileChangesWatcher = useFileChangesWatcher();
    const environment = useEnvironment();

    React.useEffect(() => {
        if (!file) {
            return;
        }
        setFilename(path.basename(file.filePath));
        setModified(generateHashCode(file.editorValue) !== file.hash || !file.associatedWithFile);
    }, [file]);

    React.useEffect(() => {
        setUncommitted(
            fileChangesWatcher.fileChanges
                .filter(change => change.user === environment.username)
                .some(change => change.filePath === path.relative(directory, file?.filePath || ""))
        );
    }, [fileChangesWatcher.fileChanges, file?.filePath, environment.username, directory]);

    React.useEffect(() => {
        setActive(props.filePath === activeFilePath);
    }, [activeFilePath, props.filePath]);

    const handleClickEvent = () => {
        props.onSelect(props.filePath);
    };

    const handleCloseEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(closeFile(props.filePath));
    };

    return (
        <div
            className={`FileTab${active ? " FileTab--active" : ""}${modified ? " FileTab--modified" : ""}`}
            onClick={() => handleClickEvent()}
            title={props.filePath}
        >
            {filename}
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
