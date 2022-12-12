import React, {Suspense, lazy} from "react";

import ModulesMapping from "./mapping.json";

const modules = {};
Object.keys(ModulesMapping).forEach(mapping => {
    modules[mapping] = lazy(() => import(`./modules/${ModulesMapping[mapping]}`));
});

export const Preview: React.VFC = () => {
    const [fileContent, setFileContent] = React.useState<string>(null);
    const [relativeFilePath, setRelativeFilePath] = React.useState<string>(null);

    const broadcastChannel = React.useRef<BroadcastChannel | null>(null);

    React.useEffect(() => {
        broadcastChannel.current = new BroadcastChannel("preview");

        broadcastChannel.current.onmessage = event => {
            if (event.data.relativeFilePath === null || event.data.fileContent === null) {
                return;
            }
            setRelativeFilePath(event.data.relativeFilePath);
            setFileContent(event.data.fileContent);
        };

        return () => {
            broadcastChannel.current.close();
        };
    }, []);

    if (relativeFilePath) {
        const Module = modules[relativeFilePath];
        if (Module) {
            return (
                <Suspense fallback={<div>Loading...</div>}>
                    <Module data={fileContent} />
                </Suspense>
            );
        }
    }

    return <>blabla</>;
};
