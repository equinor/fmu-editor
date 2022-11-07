import React from "react";
import {VscChevronDown, VscChevronRight, VscFile} from "react-icons/vsc";

import {FileTree} from "@shared-types/file-tree";

export type DirectoryProps = {
    name: string;
    level: number;
    content?: FileTree;
};

export const Directory: React.VFC<DirectoryProps> = props => {
    const [expanded, setExpanded] = React.useState<boolean>(true);

    return (
        <div className="Directory">
            <div
                className="DirectoryTitle"
                style={{paddingLeft: props.level * 16}}
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <VscChevronDown fontSize="small" /> : <VscChevronRight fontSize="small" />}
                {props.name}
            </div>
            <div className="DirectoryContent">
                {expanded &&
                    props.content &&
                    props.content.map(item => {
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
                                key={item.name}
                            />
                        );
                    })}
            </div>
        </div>
    );
};
