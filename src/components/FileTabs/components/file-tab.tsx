import {editor} from "@editors/editor";
import {useFileChanges} from "@hooks/useFileChanges";
import {Close} from "@mui/icons-material";
import {useTheme} from "@mui/material";
import {useEnvironmentService} from "@services/environment-service";

import React from "react";
import {VscCircleFilled} from "react-icons/vsc";

import {File} from "@utils/file-system/file";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {closeFile, setPermanentOpen} from "@redux/reducers/files";

import {FileChangeOrigin} from "@shared-types/file-changes";

import path from "path";

import "./file-tab.css";

export type FileTabProps = {
    filePath: string;
    onSelect: (filePath: string) => void;
};

const FILE_ORIGINS = [FileChangeOrigin.USER, FileChangeOrigin.BOTH];

export const FileTab: React.FC<FileTabProps> = props => {
    const [filename, setFilename] = React.useState<string>("");
    const [active, setActive] = React.useState<boolean>(false);
    const [modified, setModified] = React.useState<boolean>(false);
    const [exists, setExists] = React.useState<boolean>(true);
    const [uncommitted, setUncommitted] = React.useState<boolean>(false);

    const interval = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();
    const dispatch = useAppDispatch();
    const file = useAppSelector(state => state.files.files.find(el => el.filePath === props.filePath));
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const {fileChanges} = useFileChanges(FILE_ORIGINS);
    const {username} = useEnvironmentService();

    React.useLayoutEffect(() => {
        const currentFile = new File(path.relative(workingDirectoryPath, props.filePath), workingDirectoryPath);
        const checkFile = () => {
            if (!currentFile.exists()) {
                setExists(false);
                return;
            }
            setExists(true);
            setModified(editor.getHashCode(props.filePath) !== file?.hash || !file?.associatedWithFile);
        };
        checkFile();
        interval.current = setInterval(checkFile, 3000);

        return () => {
            if (interval.current) {
                clearInterval(interval.current);
            }
        };
    }, [props.filePath, file, workingDirectoryPath]);

    React.useLayoutEffect(() => {
        if (!file) {
            return;
        }
        setFilename(path.basename(file.filePath));
    }, [file]);

    React.useEffect(() => {
        setUncommitted(
            fileChanges.some(change => {
                const changeFile = new File(change.relativePath, workingDirectoryPath);
                return (
                    changeFile.getUserVersion(username).relativePath() ===
                    path.relative(workingDirectoryPath, file?.filePath || "")
                );
            })
        );
    }, [fileChanges, file?.filePath, workingDirectoryPath, username]);

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
            className={`FileTab${active ? " FileTab--active" : ""}${exists ? "" : " FileTab--deleted"}`}
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
            {modified && (
                <span title="Modified" className="FileTab--modified">
                    <VscCircleFilled fontSize="inherit" style={{color: theme.palette.text.secondary}} />
                </span>
            )}
            <div className="FileTab__CloseButton" onClick={e => handleCloseEvent(e)}>
                <Close fontSize="inherit" />
            </div>
        </div>
    );
};
