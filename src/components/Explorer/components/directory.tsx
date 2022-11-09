import {useTheme} from "@mui/material";

import React from "react";
import {VscChevronDown, VscChevronRight, VscFile} from "react-icons/vsc";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {openFile} from "@redux/thunks";

import {FileTree, FileTreeStates} from "@shared-types/file-tree";

import {v4} from "uuid";

export type DirectoryProps = {
    name: string;
    level: number;
    onDirStateChange: (indices: number[], isExpanded: boolean) => void;
    indices: number[];
    collapsed?: number;
    content?: FileTree;
};

export const Directory: React.VFC<DirectoryProps> = props => {
    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const activeFile = useAppSelector(state => state.files.activeFile);
    const [expanded, setExpanded] = React.useState<boolean>(true);

    const dispatch = useAppDispatch();
    const theme = useTheme();

    React.useEffect(() => {
        if (props.collapsed !== undefined) {
            setExpanded(false);
        }
    }, [props.collapsed]);

    React.useEffect(() => {
        if (!fileTreeStates || fileTreeStates.length === 0) {
            return;
        }
        let current = fileTreeStates;
        props.indices.forEach((index, i) => {
            if (i < props.indices.length - 1 && current[index].children !== undefined) {
                current = fileTreeStates[index].children as FileTreeStates;
            } else if (current.at(index)) {
                setExpanded(current[index].expanded);
            }
        });
    }, []);

    const handleDirStateChange = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        setExpanded(prev => !prev);
        props.onDirStateChange(props.indices, !expanded);
        e.preventDefault();
    };

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, path: string) => {
        openFile(path, dispatch);
        e.preventDefault();
    };

    return (
        <div className="Directory">
            <a
                className="ExplorerItem"
                href="#"
                onClick={e => handleDirStateChange(e)}
                style={{color: theme.palette.text.primary}}
            >
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
                                    style={{color: theme.palette.text.primary}}
                                >
                                    {Array(props.level)
                                        .fill(0)
                                        .map(_ => (
                                            <div className="ExplorerPath" key={`${item.name}-${v4()}`} />
                                        ))}
                                    <div className="ExplorerItemText">
                                        <VscFile />
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
                                collapsed={props.collapsed}
                                key={item.name}
                                indices={[...props.indices, index]}
                                onDirStateChange={props.onDirStateChange}
                            />
                        );
                    })}
            </div>
        </div>
    );
};
