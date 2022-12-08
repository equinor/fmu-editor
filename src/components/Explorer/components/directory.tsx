import React from "react";
import {VscChevronDown, VscChevronRight} from "react-icons/vsc";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setFileTreeStates} from "@redux/reducers/files";

import {FileTree} from "@shared-types/file-tree";

import path from "path";
import {v4} from "uuid";

import {File} from "./file";

export type DirectoryProps = {
    name: string;
    level: number;
    path: string;
    content?: FileTree;
};

export const Directory: React.VFC<DirectoryProps> = props => {
    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const [expanded, setExpanded] = React.useState<boolean>(true);

    const dispatch = useAppDispatch();

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

            if (fileTreeStates.includes(props.path) && expanded) {
                newFileTreeStates = [...newFileTreeStates.filter(el => el !== props.path)];
            } else if (!expanded) {
                newFileTreeStates = [...newFileTreeStates, props.path];
            }

            dispatch(setFileTreeStates(newFileTreeStates));
            e.preventDefault();
        },
        [fileTreeStates, dispatch, expanded, props.path]
    );

    return (
        <div className="Directory">
            <a className="ExplorerItem" href="#" onClick={e => handleDirStateChange(e)} title={props.path}>
                {props.level > 1 &&
                    Array(props.level - 1)
                        .fill(0)
                        .map(_ => <div className="ExplorerPath" key={`${props.name}-${v4()}}`} />)}
                <div className="ExplorerItemIcon">
                    {expanded ? <VscChevronDown fontSize="small" /> : <VscChevronRight fontSize="small" />}
                </div>
                <div className="ExplorerItemText">{props.name}</div>
            </a>
            <div className="DirectoryContent">
                {expanded &&
                    props.content &&
                    props.content.map(item => {
                        if (item.type === "file") {
                            return (
                                <File
                                    key={path.join(props.path, item.name)}
                                    level={props.level}
                                    name={item.name}
                                    path={path.join(props.path, item.name)}
                                />
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
