import {useFileManager} from "@services/file-manager";

import React from "react";

import {useAppSelector} from "@redux/hooks";

import fs from "fs";

import "./preview.css";

const trueAsStr = "true" as any;

export type PreviewProps = {
    filePath: string;
};

export const Preview: React.VFC<PreviewProps> = props => {
    const [previewAvailable, setPreviewAvailable] = React.useState<boolean>(false);
    const broadcastChannel = React.useRef<BroadcastChannel | null>(null);

    const directory = useAppSelector(state => state.files.directory);
    const theme = useAppSelector(state => state.ui.settings.theme);
    const {fileManager} = useFileManager();

    React.useEffect(() => {
        broadcastChannel.current = new BroadcastChannel("preview");

        broadcastChannel.current.onmessage = event => {
            if (event.data.moduleAvailable) {
                setPreviewAvailable(true);
                return;
            }
            setPreviewAvailable(false);
        };

        return () => {
            broadcastChannel.current.close();
        };
    }, []);

    React.useEffect(() => {
        if (broadcastChannel.current && directory && props.filePath) {
            broadcastChannel.current.postMessage({
                relativeFilePath: fileManager.relativeFilePath(fileManager.getOriginalFileIfExists(props.filePath)),
                fileContent: fs.readFileSync(props.filePath, "utf8"),
                theme,
            });
        }
    }, [props.filePath, directory, fileManager, theme]);

    /* eslint-disable react/no-unknown-property */
    return (
        <div className="Preview">
            <div className="Preview__NoPreviewOverlay" style={{display: previewAvailable ? "none" : "flex"}}>
                No preview available
            </div>
            <webview
                src="http://localhost:3000/preview.html"
                nodeintegration={trueAsStr}
                className="Preview__Webview"
            />
        </div>
    );
};
