import {useTheme} from "@mui/material";

import React from "react";

import {Surface} from "@components/Surface";

import {useAppSelector} from "@redux/hooks";

import {FileTab} from "./components/file-tab";
import "./file-tabs.css";

export type FileTabsProps = {
    onFileChange: (uuid: string) => void;
};

export const FileTabs: React.FC<FileTabsProps> = props => {
    const theme = useTheme();
    const files = useAppSelector(state => state.files.files);

    return (
        <Surface elevation="raised" className="FileTabs">
            {files.map(file => (
                <FileTab
                    key={file.filePath}
                    filePath={file.filePath}
                    onSelect={(filePath: string) => props.onFileChange(filePath)}
                />
            ))}
        </Surface>
    );
};
