import {useOngoingChangesForFile} from "@hooks/useOngoingChangesForFile";
import {AvatarGroup} from "@mui/material";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {getFileIcon} from "@src/file-icons";

import {File} from "@utils/file-system/file";

import {ContextMenu} from "@components/ContextMenu";
import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setPermanentOpen} from "@redux/reducers/files";
import {setDiffFiles, setView} from "@redux/reducers/ui";
import {openFile} from "@redux/thunks";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {View} from "@shared-types/ui";

import {v4} from "uuid";

export type FileComponentProps = {
    file: File;
    level: number;
};

export const FileComponent: React.FC<FileComponentProps> = props => {
    const ref = React.useRef<HTMLAnchorElement | null>(null);

    const userChanges = useOngoingChangesForFile(props.file.getMainVersion().relativePath());
    const activeFile = useAppSelector(state => state.files.activeFile);
    const dispatch = useAppDispatch();
    const {fileManager} = useFileManager();
    const globalSettings = useGlobalSettings();

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        openFile(props.file.absolutePath(), fileManager, dispatch, globalSettings);
        e.preventDefault();
    };

    const handleFileDoubleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        dispatch(setPermanentOpen(props.file.absolutePath()));
        e.preventDefault();
    };

    const handleUserChangesClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        dispatch(
            setDiffFiles({
                mainFile: props.file.getMainVersion().relativePath(),
                userFile: props.file.getUserVersion(userChanges[0].user).relativePath(),
                origin: FileChangeOrigin.USER,
            })
        );
        dispatch(setView(View.OngoingChanges));
        e.stopPropagation();
        e.preventDefault();
    };

    const contextMenuTemplate = React.useMemo(() => {
        return [
            {
                label: "Rename...",
                icon: null,
                click: () => {},
                shortcut: null,
            },
            {
                label: "Delete",
                icon: null,
                click: () => {},
                shortcut: null,
            },
        ];
    }, [dispatch]);

    return (
        <a
            href="#"
            className={`ExplorerItem${activeFile === props.file.absolutePath() ? " ExplorerItem--active" : ""}`}
            onClick={e => handleFileClick(e)}
            onDoubleClick={e => handleFileDoubleClick(e)}
            title={props.file.relativePath()}
            ref={ref}
        >
            <ContextMenu template={contextMenuTemplate} parent={ref.current} />
            {Array(props.level)
                .fill(0)
                .map(_ => (
                    <div className="ExplorerPath" key={`${props.file.relativePath()}-${v4()}`} />
                ))}
            <div className="ExplorerItemIcon">{getFileIcon(props.file.relativePath())}</div>
            <div className="ExplorerItemText">{props.file.baseName()}</div>
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
