import React from "react";
import {VscChevronDown, VscChevronRight, VscFile} from "react-icons/vsc";

import {useAppSelector} from "@redux/hooks";

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
    const [expanded, setExpanded] = React.useState<boolean>(true);

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

    const handleDirStateChange = () => {
        setExpanded(prev => !prev);
        props.onDirStateChange(props.indices, !expanded);
    };

    return (
        <div className="Directory">
            <div className="DirectoryTitle" onClick={handleDirStateChange}>
                {props.level > 1 &&
                    Array(props.level - 1)
                        .fill(0)
                        .map((_, i) => <div className="ExplorerPath" key={`${props.name}-${v4()}}`} />)}
                <div className="ExplorerItemText">
                    {expanded ? <VscChevronDown fontSize="small" /> : <VscChevronRight fontSize="small" />}
                    {props.name}
                </div>
            </div>
            <div className="DirectoryContent">
                {expanded &&
                    props.content &&
                    props.content.map((item, index) => {
                        if (item.type === "file") {
                            return (
                                <div className="File" key={item.name}>
                                    {Array(props.level)
                                        .fill(0)
                                        .map((_, i) => (
                                            <div className="ExplorerPath" key={`${item.name}-${v4()}`} />
                                        ))}
                                    <div className="ExplorerItemText">
                                        <VscFile />
                                        {item.name}
                                    </div>
                                </div>
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
