import React from "react";
import {VscChevronDown, VscChevronRight} from "react-icons/vsc";

import {FileBasic} from "@utils/file-system/basic";
import {Directory} from "@utils/file-system/directory";
import {File} from "@utils/file-system/file";

import {ContextMenu} from "@components/ContextMenu";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {renameDirectory, renameFile, setFileTreeStates} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {
    resetDragParentFolder,
    setActiveItemPath,
    setCreateFile,
    setCreateFolder,
    setDragParentFolder,
} from "@redux/reducers/ui";

import {NotificationType} from "@shared-types/notifications";

import path from "path";
import {v4} from "uuid";

import {FileComponent} from "./file-component";
import {NewItem, NewItemType} from "./new-item";

import {ContextMenuTemplate} from "../../ContextMenu/context-menu";

export type DirectoryComponentProps = {
    level: number;
    directory: Directory;
    rootDirectory?: boolean;
};

export const DirectoryComponent: React.VFC<DirectoryComponentProps> = props => {
    const [dirName, setDirName] = React.useState<string>(props.directory.baseName());
    const [editMode, setEditMode] = React.useState<boolean>(false);
    const [deleted, setDeleted] = React.useState<boolean>(false);
    const [dragOver, setDragOver] = React.useState<boolean>(false);
    const [creatingNewFile, setCreatingNewFile] = React.useState<boolean>(false);
    const [creatingNewDir, setCreatingNewDir] = React.useState<boolean>(false);

    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const dragParentFolder = useAppSelector(state => state.ui.explorer.dragParentFolder);
    const activeItemPath = useAppSelector(state => state.ui.explorer.activeItemPath);
    const createFile = useAppSelector(state => state.ui.explorer.createFile);
    const createFolder = useAppSelector(state => state.ui.explorer.createFolder);

    const [expanded, setExpanded] = React.useState<boolean>(true);

    const ref = React.useRef<HTMLDivElement | null>(null);

    const dispatch = useAppDispatch();

    const handleDirStateChange = React.useCallback(() => {
        if (editMode) return;
        let newFileTreeStates = [...fileTreeStates];

        if (fileTreeStates.includes(props.directory.relativePath()) && expanded) {
            newFileTreeStates = [...newFileTreeStates.filter(el => el !== props.directory.relativePath())];
        } else if (!expanded) {
            newFileTreeStates = [...newFileTreeStates, props.directory.relativePath()];
        }

        dispatch(setFileTreeStates(newFileTreeStates));
    }, [fileTreeStates, dispatch, expanded, props.directory, editMode]);

    React.useEffect(() => {
        const fileBasic = new FileBasic(
            path.relative(props.directory.workingDirectory(), activeItemPath),
            props.directory.workingDirectory()
        );
        if (
            createFile &&
            ((fileBasic.isDirectory() && fileBasic.absolutePath() === props.directory.absolutePath()) ||
                (!fileBasic.isDirectory() && fileBasic.parentDirectoryPath() === props.directory.absolutePath()))
        ) {
            if (!expanded) {
                handleDirStateChange();
            }
            setCreatingNewFile(true);
        }
    }, [createFile, activeItemPath, props.directory, expanded, handleDirStateChange]);

    React.useEffect(() => {
        const fileBasic = new FileBasic(
            path.relative(props.directory.workingDirectory(), activeItemPath),
            props.directory.workingDirectory()
        );
        if (
            createFolder &&
            ((fileBasic.isDirectory() && fileBasic.absolutePath() === props.directory.absolutePath()) ||
                (!fileBasic.isDirectory() && fileBasic.parentDirectoryPath() === props.directory.absolutePath()))
        ) {
            if (!expanded) {
                handleDirStateChange();
            }
            setCreatingNewDir(true);
        }
    }, [createFolder, activeItemPath, props.directory, expanded, handleDirStateChange]);

    React.useLayoutEffect(() => {
        if (fileTreeStates && fileTreeStates.includes(props.directory.relativePath())) {
            setExpanded(true);
            return;
        }
        setExpanded(false);
    }, [fileTreeStates, props.directory]);

    const handleDelete = React.useCallback(() => {
        if (props.directory.remove()) {
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: `Directory '${props.directory.baseName()}' successfully deleted.`,
                })
            );
            setDeleted(true);
        } else {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: `Directory '${props.directory.baseName()}' could not be deleted.`,
                })
            );
        }
    }, [props.directory, dispatch]);

    const contextMenuTemplate = React.useMemo(() => {
        const template: ContextMenuTemplate = [
            {
                label: "New File...",
                click: () => {
                    if (!expanded) {
                        handleDirStateChange();
                    }
                    setCreatingNewFile(true);
                },
            },
            {
                label: "New Folder...",
                click: () => {
                    if (!expanded) {
                        handleDirStateChange();
                    }
                    setCreatingNewDir(true);
                },
            },
        ];
        if (!props.rootDirectory) {
            template.push(
                {
                    divider: true,
                },
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
                }
            );
        }
        return template;
    }, [handleDelete, handleDirStateChange, expanded, props.rootDirectory]);

    const handleSubmit = React.useCallback(
        (name: string) => {
            const oldName = props.directory.baseName();
            const oldPath = props.directory.absolutePath();
            if (props.directory.rename(name)) {
                dispatch(renameDirectory({oldFilePath: oldPath, newFilePath: props.directory.absolutePath()}));
                dispatch(
                    addNotification({
                        type: NotificationType.SUCCESS,
                        message: `Directory successfully renamed from '${oldName}' to '${name}'.`,
                    })
                );
                setDirName(name);
            } else {
                dispatch(
                    addNotification({
                        type: NotificationType.ERROR,
                        message: `Directory '${oldName}' could not be renamed to '${name}'.`,
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
        setDirName(props.directory.baseName());
    }, [props.directory]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", props.directory.relativePath());
        dispatch(setDragParentFolder(props.directory.parentDirectoryPath()));
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        dispatch(resetDragParentFolder());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragParentFolder !== props.directory.absolutePath()) {
            setDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (dragParentFolder !== props.directory.absolutePath()) {
                const droppedAsset = new FileBasic(
                    e.dataTransfer.getData("text/plain"),
                    props.directory.workingDirectory()
                );
                const oldPath = droppedAsset.absolutePath();
                if (droppedAsset.moveToDir(props.directory.absolutePath())) {
                    dispatch(renameFile({oldFilePath: oldPath, newFilePath: droppedAsset.absolutePath()}));
                    dispatch(
                        addNotification({
                            type: NotificationType.SUCCESS,
                            message: `'${droppedAsset.relativePath()}' successfully moved to '${props.directory.relativePath()}'.`,
                        })
                    );
                } else {
                    dispatch(
                        addNotification({
                            type: NotificationType.ERROR,
                            message: `'${droppedAsset.relativePath()}' could not be moved to '${props.directory.relativePath()}'.`,
                        })
                    );
                }
            }
            e.dataTransfer.clearData();
        },
        [props.directory, dispatch, dragParentFolder]
    );

    const handleNewFileClosed = React.useCallback(() => {
        setCreatingNewFile(false);
        dispatch(setCreateFile(false));
    }, [dispatch]);

    const handleNewDirClosed = React.useCallback(() => {
        setCreatingNewDir(false);
        dispatch(setCreateFolder(false));
    }, [dispatch]);

    const handleDirectoryTitleClick = React.useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            handleDirStateChange();
            dispatch(setActiveItemPath(props.directory.absolutePath()));
            e.preventDefault();
            e.stopPropagation();
        },
        [props.directory, dispatch, handleDirStateChange]
    );

    const handleDirectoryClick = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (props.rootDirectory) {
                dispatch(setActiveItemPath(props.directory.absolutePath()));
                e.preventDefault();
                e.stopPropagation();
            }
        },
        [props.directory, dispatch, props.rootDirectory]
    );

    if (deleted) {
        return null;
    }

    /* eslint-disable jsx-a11y/no-autofocus */
    return (
        <div
            className={`Directory${dragOver ? " DirectoryDragOver" : ""}${props.rootDirectory ? " RootDirectory" : ""}`}
            ref={ref}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleDirectoryClick}
        >
            <ContextMenu parent={ref.current} template={contextMenuTemplate} />
            {!props.rootDirectory && (
                <a
                    className={`ExplorerItem${
                        activeItemPath === props.directory.absolutePath() ? " ExplorerItem--active" : ""
                    }`}
                    href="#"
                    onClick={handleDirectoryTitleClick}
                    title={props.directory.relativePath()}
                >
                    {props.level > 1 &&
                        Array(props.level - 1)
                            .fill(0)
                            .map(_ => <div className="ExplorerPath" key={`${props.directory.baseName()}-${v4()}}`} />)}
                    <div className="ExplorerItemIcon">
                        {expanded ? <VscChevronDown fontSize="small" /> : <VscChevronRight fontSize="small" />}
                    </div>
                    {editMode ? (
                        <>
                            <div className="Overflow" onClick={() => onClose()} />
                            <input
                                className="ExplorerItemInput"
                                autoFocus
                                type="text"
                                defaultValue={dirName}
                                onKeyDown={handleKeyDown}
                            />
                        </>
                    ) : (
                        <div className="ExplorerItemText">{dirName}</div>
                    )}
                </a>
            )}
            <div className="DirectoryContent">
                {(expanded || props.rootDirectory) && (
                    <>
                        {props.directory && creatingNewDir && (
                            <NewItem
                                type={NewItemType.DIRECTORY}
                                onClose={() => handleNewDirClosed()}
                                onSubmit={() => handleNewDirClosed()}
                                directoryRelativePath={props.directory.relativePath()}
                                level={props.level}
                            />
                        )}
                        {props.directory &&
                            props.directory
                                .getContent()
                                .filter(item => item.isDirectory())
                                .map(item => (
                                    <DirectoryComponent
                                        level={props.level + 1}
                                        directory={item as Directory}
                                        key={item.relativePath()}
                                    />
                                ))}
                        {props.directory && creatingNewFile && (
                            <NewItem
                                type={NewItemType.FILE}
                                onClose={() => handleNewFileClosed()}
                                onSubmit={() => handleNewFileClosed()}
                                directoryRelativePath={props.directory.relativePath()}
                                level={props.level}
                            />
                        )}
                        {props.directory &&
                            props.directory
                                .getContent()
                                .filter(item => !item.isDirectory())
                                .map(item => (
                                    <FileComponent key={item.relativePath()} level={props.level} file={item as File} />
                                ))}
                    </>
                )}
            </div>
        </div>
    );
    /* eslint-enable jsx-a11y/no-autofocus */
};
