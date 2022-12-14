import {useOngoingChangesForFile} from "@hooks/useOngoingChangesForFile";
import {AvatarGroup} from "@mui/material";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {getFileIcon} from "@src/file-icons";

import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveOngoingChangesDiffFile} from "@redux/reducers/files";
import {setOngoingChangesFile, setView} from "@redux/reducers/ui";
import {openFile} from "@redux/thunks";

import {View} from "@shared-types/ui";

import path from "path";
import {v4} from "uuid";

export type FileProps = {
    path: string;
    name: string;
    level: number;
};

export const File: React.FC<FileProps> = props => {
    const directory = useAppSelector(state => state.files.directory);
    const userChanges = useOngoingChangesForFile(props.path);
    const activeFile = useAppSelector(state => state.files.activeFile);
    const dispatch = useAppDispatch();
    const {fileManager} = useFileManager();
    const globalSettings = useGlobalSettings();

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        openFile(path.join(directory, props.path), fileManager, dispatch, globalSettings);
        e.preventDefault();
    };

    const handleUserChangesClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        dispatch(
            setActiveOngoingChangesDiffFile({
                relativeFilePath: fileManager.getUserFileIfExists(
                    path.join(directory, props.path),
                    userChanges[0].user
                ),
            })
        );
        dispatch(setOngoingChangesFile(props.path));
        dispatch(setView(View.OngoingChanges));
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <a
            href="#"
            className={`ExplorerItem${
                path.relative(directory, activeFile) === props.path ? " ExplorerItem--active" : ""
            }`}
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
                <AvatarGroup
                    max={3}
                    sx={{
                        "& .MuiAvatar-root": {width: 16, height: 16, fontSize: "0.6rem"},
                    }}
                    onClick={handleUserChangesClick}
                >
                    {userChanges.map(change => (
                        <Avatar key={change.user} user={change.user} size={16} />
                    ))}
                </AvatarGroup>
            </div>
        </a>
    );
};
