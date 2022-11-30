import React from "react";
import {VscFile, VscFileCode} from "react-icons/vsc";

const FileIconMapping: {[key: string]: React.ReactNode} = {
    "/share/webviz/": <VscFileCode />,
};

export const getFileIcon = (filePath: string): React.ReactNode => {
    const icon = Object.keys(FileIconMapping).find(key => filePath.startsWith(key));
    return icon ? FileIconMapping[icon] : <VscFile />;
};
