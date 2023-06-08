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
    const fileTabsContentRef = React.useRef<HTMLDivElement>(null);
    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const files = useAppSelector(state => state.files.files);
    const activeFile = useAppSelector(state => state.files.activeFilePath);

    React.useEffect(() => {
        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (timeout.current) {
            clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(() => {
            const fileTab = fileTabsContentRef.current?.querySelector(`[title="${activeFile}"]`);
            if (fileTabsContentRef.current && fileTab) {
                const parentLeft = fileTabsContentRef.current.getBoundingClientRect().left || 0;
                const parentWidth = fileTabsContentRef.current.getBoundingClientRect().width || 0;
                const fileTabRelativeLeft = fileTab.getBoundingClientRect().left - parentLeft;
                const fileTabRelativeRight = fileTabRelativeLeft + fileTab.getBoundingClientRect().width;
                if (fileTabRelativeLeft < 0 || fileTabRelativeRight > parentWidth) {
                    const distanceRight = parentWidth - fileTabRelativeRight;
                    let newScrollLeft = fileTabsContentRef.current.scrollLeft + fileTabRelativeLeft;
                    if (fileTabRelativeLeft > Math.abs(distanceRight)) {
                        newScrollLeft = fileTabsContentRef.current.scrollLeft + Math.abs(distanceRight);
                    }
                    fileTabsContentRef.current?.scrollTo({left: newScrollLeft, behavior: "smooth"});
                }
            }
        }, 100);
    }, [activeFile]);

    return (
        <Surface elevation="raised" className="FileTabs">
            <div className="FileTabsContent" ref={fileTabsContentRef}>
                {files.map(file => (
                    <FileTab
                        key={file.filePath}
                        filePath={file.filePath}
                        onSelect={(filePath: string) => props.onFileChange(filePath)}
                    />
                ))}
            </div>
            <div className="Divider Divider--vertical" />
            <div className="FileTabsActions" id="file-tabs-actions">{props.actions}</div>
        </Surface>
    );
};
