import React from "react";

import {Surface} from "@components/Surface";

import {useAppSelector} from "@redux/hooks";

import {FileTab} from "./components/file-tab";
import "./file-tabs.css";

export type FileTabsProps = {
    onFileChange: (uuid: string) => void;
    actions?: React.ReactNode;
};

export const FileTabs: React.FC<FileTabsProps> = props => {
    const files = useAppSelector(state => state.files.files);

    return (
        <Surface elevation="raised" className="FileTabs">
            <div className="FileTabsContent">
                {files.map(file => (
                    <FileTab
                        key={file.filePath}
                        filePath={file.filePath}
                        onSelect={(filePath: string) => props.onFileChange(filePath)}
                    />
                ))}
            </div>
            <div className="FileTabsActions">{props.actions}</div>
        </Surface>
    );
};
