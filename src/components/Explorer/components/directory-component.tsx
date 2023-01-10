import React from "react";
import {VscChevronDown, VscChevronRight} from "react-icons/vsc";

import {Directory} from "@utils/file-system/directory";
import {File} from "@utils/file-system/file";

import {ContextMenu} from "@components/ContextMenu";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {renameDirectory, setFileTreeStates} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";

import {NotificationType} from "@shared-types/notifications";

import {v4} from "uuid";

import {FileComponent} from "./file-component";
import {NewItem, NewItemType} from "./new-item";

export type DirectoryComponentProps = {
    level: number;
    directory: Directory;
};

export const DirectoryComponent: React.VFC<DirectoryComponentProps> = props => {
    const [dirName, setDirName] = React.useState<string>(props.directory.baseName());
    const [editMode, setEditMode] = React.useState<boolean>(false);
    const [deleted, setDeleted] = React.useState<boolean>(false);
    const [dragOver, setDragOver] = React.useState<boolean>(false);
    const [creatingNewFile, setCreatingNewFile] = React.useState<boolean>(false);
    const [creatingNewDir, setCreatingNewDir] = React.useState<boolean>(false);

    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const [expanded, setExpanded] = React.useState<boolean>(true);

    const ref = React.useRef<HTMLDivElement | null>(null);

    const dispatch = useAppDispatch();

    React.useLayoutEffect(() => {
        if (fileTreeStates && fileTreeStates.includes(props.directory.relativePath())) {
            setExpanded(true);
            return;
        }
        setExpanded(false);
    }, [fileTreeStates, props.directory]);

    const handleDirStateChange = React.useCallback(
        (e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            if (editMode) return;
            let newFileTreeStates = [...fileTreeStates];

            if (fileTreeStates.includes(props.directory.relativePath()) && expanded) {
                newFileTreeStates = [...newFileTreeStates.filter(el => el !== props.directory.relativePath())];
            } else if (!expanded) {
                newFileTreeStates = [...newFileTreeStates, props.directory.relativePath()];
            }

            dispatch(setFileTreeStates(newFileTreeStates));
            if (e) {
                e.preventDefault();
            }
        },
        [fileTreeStates, dispatch, expanded, props.directory, editMode]
    );

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
        return [
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
            },
        ];
    }, [handleDelete, handleDirStateChange, expanded]);

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

    if (deleted) {
        return null;
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    /* eslint-disable jsx-a11y/no-autofocus */
    return (
        <div
            className={`Directory${dragOver ? " DirectoryDragOver" : ""}`}
            ref={ref}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <ContextMenu parent={ref.current} template={contextMenuTemplate} />
            <a
                className="ExplorerItem"
                href="#"
                onClick={e => handleDirStateChange(e)}
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
            <div className="DirectoryContent">
                {expanded && (
                    <>
                        {props.directory && creatingNewDir && (
                            <NewItem
                                type={NewItemType.DIRECTORY}
                                onClose={() => setCreatingNewDir(false)}
                                onSubmit={() => {
                                    setCreatingNewDir(false);
                                }}
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
                                onClose={() => setCreatingNewFile(false)}
                                onSubmit={() => {
                                    setCreatingNewFile(false);
                                }}
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
