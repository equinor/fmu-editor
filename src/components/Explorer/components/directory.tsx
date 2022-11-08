import React from "react";
import {VscChevronDown, VscChevronRight, VscFile} from "react-icons/vsc";

import {useAppSelector} from "@redux/hooks";

import {FileTree, FileTreeStates} from "@shared-types/file-tree";

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
            } else {
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
            <div className="DirectoryTitle" style={{paddingLeft: props.level * 16}} onClick={handleDirStateChange}>
                {expanded ? <VscChevronDown fontSize="small" /> : <VscChevronRight fontSize="small" />}
                {props.name}
            </div>
            <div className="DirectoryContent">
                {expanded &&
                    props.content &&
                    props.content.map((item, index) => {
                        if (item.type === "file") {
                            return (
                                <div className="File" key={item.name} style={{paddingLeft: (props.level + 1) * 16}}>
                                    <>
                                        <VscFile />
                                        {item.name}
                                    </>
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
