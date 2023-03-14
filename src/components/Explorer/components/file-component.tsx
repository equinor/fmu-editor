import {useOngoingChangesForFile} from "@hooks/useOngoingChangesForFile";
import {AvatarGroup} from "@mui/material";
import {notificationsService} from "@services/notifications-service";

import React from "react";

import {getFileIcon} from "@src/file-icons";

import {File} from "@utils/file-system/file";

import {ContextMenu} from "@components/ContextMenu";
import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {renameFile, setPermanentOpen} from "@redux/reducers/files";
import {resetDragParentFolder, setActiveItemPath, setDiffFiles, setDragParentFolder, setView} from "@redux/reducers/ui";
import {openFile} from "@redux/thunks";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

export type FileComponentProps = {
    file: File;
    level: number;
};

export const FileComponent: React.FC<FileComponentProps> = props => {
    const [fileName, setFileName] = React.useState<string>(props.file.baseName());
    const [editMode, setEditMode] = React.useState<boolean>(false);
    const [deleted, setDeleted] = React.useState<boolean>(false);

    const ref = React.useRef<HTMLAnchorElement | null>(null);

    const userChanges = useOngoingChangesForFile(props.file.getMainVersion().relativePath());
    const dispatch = useAppDispatch();
    const globalSettings = useGlobalSettings();
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const activeItemPath = useAppSelector(state => state.ui.explorer.activeItemPath);

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (editMode) return;
        dispatch(setActiveItemPath(props.file.absolutePath()));
        openFile(props.file.absolutePath(), workingDirectoryPath, dispatch, globalSettings);
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileDoubleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (editMode) return;
        dispatch(setPermanentOpen(props.file.absolutePath()));
        e.preventDefault();
        e.stopPropagation();
    };

    React.useEffect(() => {
        setFileName(props.file.baseName());
    }, [props.file]);

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

    const handleDelete = React.useCallback(() => {
        if (props.file.remove()) {
            notificationsService.publishNotification({
                type: NotificationType.SUCCESS,
                message: `File '${props.file.baseName()}' successfully deleted.`,
            });
            setDeleted(true);
        } else {
            notificationsService.publishNotification({
                type: NotificationType.ERROR,
                message: `File '${props.file.baseName()}' could not be deleted.`,
            });
        }
    }, [props.file]);

    const contextMenuTemplate = React.useMemo(() => {
        return [
            {
                label: "Rename...",
                click: () => {
                    setEditMode(true);
                },
            },
            {
                label: "Delete",
                click: () => {
                    handleDelete();
                },
            },
        ];
    }, [handleDelete]);

    const handleSubmit = React.useCallback(
        (name: string) => {
            const oldName = props.file.baseName();
            const oldPath = props.file.absolutePath();
            if (props.file.rename(name)) {
                dispatch(renameFile({oldFilePath: oldPath, newFilePath: props.file.absolutePath()}));
                notificationsService.publishNotification({
                    type: NotificationType.SUCCESS,
                    message: `File successfully renamed from '${oldName}' to '${name}'.`,
                });
                setFileName(name);
            } else {
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: `File '${oldName}' could not be renamed to '${name}'.`,
                });
            }
            setEditMode(false);
        },
        [props, dispatch]
    );

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleSubmit(e.currentTarget.value);
            }
        },
        [handleSubmit]
    );

    const onClose = React.useCallback(() => {
        setEditMode(false);
        setFileName(props.file.baseName());
    }, [props.file]);

    if (deleted) {
        return null;
    }

    const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", props.file.relativePath());
        dispatch(setDragParentFolder(props.file.parentDirectoryPath()));
    };

    const handleDragEnd = (e: React.DragEvent<HTMLAnchorElement>) => {
        e.stopPropagation();
        dispatch(resetDragParentFolder());
    };

    /* eslint-disable jsx-a11y/no-autofocus */
    return (
        <a
            href="#"
            className={`ExplorerItem${activeItemPath === props.file.absolutePath() ? " ExplorerItem--active" : ""}`}
            onClick={e => handleFileClick(e)}
            onDoubleClick={e => handleFileDoubleClick(e)}
            title={props.file.relativePath()}
            ref={ref}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <ContextMenu template={contextMenuTemplate} parent={ref.current} />
            {Array(props.level)
                .fill(0)
                .map((_, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div className="ExplorerPath" key={`${props.file.relativePath()}-${index}`} />
                ))}
            <div className="ExplorerItemIcon">{getFileIcon(props.file.relativePath())}</div>
            {editMode ? (
                <>
                    <div className="Overflow" onClick={() => onClose()} />
                    <input
                        className="ExplorerItemInput"
                        autoFocus
                        type="text"
                        defaultValue={fileName}
                        onKeyDown={handleKeyDown}
                    />
                </>
            ) : (
                <>
                    <div className="ExplorerItemText">{fileName}</div>
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
                </>
            )}
        </a>
    );
    /* eslint-enable jsx-a11y/no-autofocus */
};
