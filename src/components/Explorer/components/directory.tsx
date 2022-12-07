import {useFileManager} from "@services/file-manager";

import React from "react";
import {VscChevronDown, VscChevronRight} from "react-icons/vsc";

import {getFileIcon} from "@src/file-icons";

import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setFileTreeStates} from "@redux/reducers/files";
import {openFile} from "@redux/thunks";

import {FileTree} from "@shared-types/file-tree";

import path from "path";
import {v4} from "uuid";

export type DirectoryProps = {
    name: string;
    level: number;
    path: string;
    content?: FileTree;
};

export const Directory: React.VFC<DirectoryProps> = props => {
    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const activeFile = useAppSelector(state => state.files.activeFile);
    const directory = useAppSelector(state => state.files.directory);
    const [expanded, setExpanded] = React.useState<boolean>(true);

    const dispatch = useAppDispatch();
    const {fileManager} = useFileManager();
    const globalSettings = useGlobalSettings();

    React.useLayoutEffect(() => {
        if (fileTreeStates && fileTreeStates.includes(props.path)) {
            setExpanded(true);
            return;
        }
        setExpanded(false);
    }, [fileTreeStates, props.path]);

    const handleDirStateChange = React.useCallback(
        (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            let newFileTreeStates = [...fileTreeStates];

            if (props.path in fileTreeStates && expanded) {
                newFileTreeStates = [...newFileTreeStates.filter(el => el !== props.path)];
            } else if (!expanded) {
                newFileTreeStates = [...newFileTreeStates, props.path];
            }

            dispatch(setFileTreeStates(newFileTreeStates));
            e.preventDefault();
        },
        [fileTreeStates, dispatch, expanded, props.path]
    );

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, filePath: string) => {
        openFile(filePath, fileManager, dispatch, globalSettings);
        e.preventDefault();
    };

    return (
        <div className="Directory">
            <a className="ExplorerItem" href="#" onClick={e => handleDirStateChange(e)}>
                {props.level > 1 &&
                    Array(props.level - 1)
                        .fill(0)
                        .map(_ => <div className="ExplorerPath" key={`${props.name}-${v4()}}`} />)}
                <div className="ExplorerItemText">
                    {expanded ? <VscChevronDown fontSize="small" /> : <VscChevronRight fontSize="small" />}
                    {props.name}
                </div>
            </a>
            <div className="DirectoryContent">
                {expanded &&
                    props.content &&
                    props.content.map((item, index) => {
                        if (item.type === "file") {
                            return (
                                <a
                                    href="#"
                                    className={`ExplorerItem${activeFile === item.path ? " ExplorerItem--active" : ""}`}
                                    key={item.name}
                                    onClick={e => handleFileClick(e, item.path)}
                                >
                                    {Array(props.level)
                                        .fill(0)
                                        .map(_ => (
                                            <div className="ExplorerPath" key={`${item.name}-${v4()}`} />
                                        ))}
                                    <div className="ExplorerItemText">
                                        {getFileIcon(item.path.replace(directory, ""))}
                                        {item.name}
                                    </div>
                                </a>
                            );
                        }
                        return (
                            <Directory
                                level={props.level + 1}
                                name={item.name}
                                content={item.children}
                                key={item.name}
                                path={path.join(props.path, item.name)}
                            />
                        );
                    })}
            </div>
        </div>
    );
};
