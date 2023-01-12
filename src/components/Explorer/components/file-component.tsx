import {useOngoingChangesForFile} from "@hooks/useOngoingChangesForFile";
import {AvatarGroup} from "@mui/material";

import React from "react";

import {getFileIcon} from "@src/file-icons";

import {File} from "@utils/file-system/file";

import {ContextMenu} from "@components/ContextMenu";
import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {renameFile, setPermanentOpen} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {setDiffFiles, setView} from "@redux/reducers/ui";
import {openFile} from "@redux/thunks";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

import {v4} from "uuid";

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
    const activeFile = useAppSelector(state => state.files.activeFile);
    const dispatch = useAppDispatch();
    const globalSettings = useGlobalSettings();
    const workingDirectory = useAppSelector(state => state.files.directory);

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (editMode) return;
        openFile(props.file.absolutePath(), workingDirectory, dispatch, globalSettings);
        e.preventDefault();
    };

    const handleFileDoubleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (editMode) return;
        dispatch(setPermanentOpen(props.file.absolutePath()));
        e.preventDefault();
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
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: `File '${props.file.baseName()}' successfully deleted.`,
                })
            );
            setDeleted(true);
        } else {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: `File '${props.file.baseName()}' could not be deleted.`,
                })
            );
        }
    }, [props.file, dispatch]);

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
                dispatch(
                    addNotification({
                        type: NotificationType.SUCCESS,
                        message: `File successfully renamed from '${oldName}' to '${name}'.`,
                    })
                );
                setFileName(name);
            } else {
                dispatch(
                    addNotification({
                        type: NotificationType.ERROR,
                        message: `File '${oldName}' could not be renamed to '${name}'.`,
                    })
                );
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
    };

    /* eslint-disable jsx-a11y/no-autofocus */
    return (
        <a
            href="#"
            className={`ExplorerItem${activeFile === props.file.absolutePath() ? " ExplorerItem--active" : ""}`}
            onClick={e => handleFileClick(e)}
            onDoubleClick={e => handleFileDoubleClick(e)}
            title={props.file.relativePath()}
            ref={ref}
            onDragStart={handleDragStart}
        >
            <ContextMenu template={contextMenuTemplate} parent={ref.current} />
            {Array(props.level)
                .fill(0)
                .map(_ => (
                    <div className="ExplorerPath" key={`${props.file.relativePath()}-${v4()}`} />
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
