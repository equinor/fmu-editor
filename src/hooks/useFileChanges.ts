import {AppMessageBus} from "@framework/app-message-bus";
import {environmentService} from "@services/environment-service";
import {FileChangesTopics} from "@services/file-changes-service";

import React from "react";

import {FileChange, FileChangeOrigin} from "@shared-types/file-changes";

export const useFileChanges = (
    origins: FileChangeOrigin[] | FileChangeOrigin,
    user?: string
): {fileChanges: FileChange[]; initialized: boolean} => {
    const [initialized, setInitialized] = React.useState(false);
    const [fileChanges, setFileChanges] = React.useState<FileChange[]>([]);

    React.useEffect(() => {
        const adjustedOrigins = Array.isArray(origins) ? origins : [origins];
        const handleFileChangesChange = (allFileChanges: FileChange[]) => {
            const username = environmentService.getUsername();
            setFileChanges(
                allFileChanges.filter(
                    change => change.user === (user || username) && adjustedOrigins.includes(change.origin)
                )
            );
            setInitialized(true);
        };

        const unsubscribeFunc = AppMessageBus.fileChanges.subscribe(
            FileChangesTopics.FILES_CHANGED,
            handleFileChangesChange
        );

        return unsubscribeFunc;
    }, [origins, user]);

    return {fileChanges, initialized};
};
