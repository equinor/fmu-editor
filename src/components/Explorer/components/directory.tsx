import React from "react";
import {VscChevronDown, VscChevronRight, VscFile} from "react-icons/vsc";

import {FileTree} from "@shared-types/file-tree";

export type DirectoryProps = {
    name: string;
    level: number;
    onDirStateChange: (indices: number[], isExpanded: boolean) => void;
    indices: number[];
    collapsed?: number;
    content?: FileTree;
};

export const Directory: React.VFC<DirectoryProps> = props => {
    const [expanded, setExpanded] = React.useState<boolean>(true);

    React.useEffect(() => {
        if (props.collapsed !== undefined) {
            setExpanded(false);
        }
    }, [props.collapsed]);

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
