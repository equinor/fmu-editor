import React from "react";

import {useAppSelector} from "@redux/hooks";

import fs from "fs";
import path from "path";

const trueAsStr = "true" as any;

export type PreviewProps = {
    filePath: string;
};

export const Preview: React.VFC<PreviewProps> = props => {
    const broadcastChannel = React.useRef<BroadcastChannel | null>(null);

    const directory = useAppSelector(state => state.files.directory);

    React.useEffect(() => {
        broadcastChannel.current = new BroadcastChannel("preview");

        return () => {
            broadcastChannel.current.close();
        };
    }, []);

    React.useEffect(() => {
        if (broadcastChannel.current && directory && props.filePath) {
            broadcastChannel.current.postMessage({
                relativeFilePath: path.relative(directory, props.filePath),
                fileContent: fs.readFileSync(props.filePath, "utf8"),
            });
        }
    }, [props.filePath, directory]);

    /* eslint-disable react/no-unknown-property */
    // @ts-ignore
    return (
        <>
            {props.filePath}
            <webview
                src="http://localhost:3000/preview.html"
                style={{border: "2px red solid", width: 1000, height: 1000}}
                nodeintegration={trueAsStr}
            />
        </>
    );
};
