import {useUserChangesForFile} from "@hooks/useUserChangesForFile";
import {Avatar} from "@mui/material";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {getFileIcon} from "@src/file-icons";

import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {openFile} from "@redux/thunks";

import path from "path";
import uniqolor from "uniqolor";
import {v4} from "uuid";

export type FileProps = {
    path: string;
    name: string;
    level: number;
};

export const File: React.FC<FileProps> = props => {
    const directory = useAppSelector(state => state.files.directory);
    const userChanges = useUserChangesForFile(props.path);
    const activeFile = useAppSelector(state => state.files.activeFile);
    const dispatch = useAppDispatch();
    const {fileManager} = useFileManager();
    const globalSettings = useGlobalSettings();

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        openFile(path.join(directory, props.path), fileManager, dispatch, globalSettings);
        e.preventDefault();
    };

    return (
        <a
            href="#"
            className={`ExplorerItem${activeFile === props.path ? " ExplorerItem--active" : ""}`}
            onClick={e => handleFileClick(e)}
            title={props.path}
        >
            {Array(props.level)
                .fill(0)
                .map(_ => (
                    <div className="ExplorerPath" key={`${props.name}-${v4()}`} />
                ))}
            <div className="ExplorerItemIcon">{getFileIcon(path.relative(directory, props.path))}</div>
            <div className="ExplorerItemText">{props.name}</div>
            <div className="ExplorerItemStatus">
                {userChanges.map(change => (
                    <Avatar
                        key={change.user}
                        sx={{
                            width: 16,
                            height: 16,
                            fontSize: 10,
                            marginRight: "4px",
                            backgroundColor: uniqolor(change.user).color,
                        }}
                        alt={change.user[0]}
                        src="/static/images/avatar/1.jpg"
                        title={`This file has been modified by '${change.user}'. Merging might be required.`}
                    />
                ))}
            </div>
        </a>
    );
};
