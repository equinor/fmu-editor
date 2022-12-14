import {CircularProgress} from "@mui/material";

import React, {Suspense, lazy} from "react";

import ModulesMapping from "./mapping.json";

const modules = {};
Object.keys(ModulesMapping).forEach(mapping => {
    modules[mapping] = lazy(() => import(`./modules/${ModulesMapping[mapping]}`));
});

export const Preview: React.VFC = () => {
    const [fileContent, setFileContent] = React.useState<string>(null);
    const [Module, setModule] = React.useState<React.FC<any> | null>(null);

    const broadcastChannel = React.useRef<BroadcastChannel | null>(null);

    React.useEffect(() => {
        broadcastChannel.current = new BroadcastChannel("preview");

        broadcastChannel.current.onmessage = event => {
            if (event.data.relativeFilePath === null || event.data.fileContent === null) {
                return;
            }

            const newModule = modules[event.data.relativeFilePath];
            setModule(newModule);
            if (newModule) {
                broadcastChannel.current.postMessage({
                    moduleAvailable: true,
                });
                setFileContent(event.data.fileContent);
                return;
            }
            broadcastChannel.current.postMessage({
                moduleAvailable: false,
            });
            setFileContent(null);
        };

        return () => {
            broadcastChannel.current.close();
        };
    }, []);

    if (Module) {
        return (
            <Suspense
                fallback={
                    <div
                        style={{
                            width: "100vw",
                            height: "100vh",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <CircularProgress />
                    </div>
                }
            >
                <Module data={fileContent} />
            </Suspense>
        );
    }

    return null;
};
