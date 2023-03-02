import {AppMessageBus} from "@framework/app-message-bus";
import {environmentService} from "@services/environment-service";
import {FileChangesTopics} from "@services/file-changes-service";

import React from "react";

import {FileChange} from "@shared-types/file-changes";

export const useNonUserFileChanges = (): FileChange[] => {
    const [nonUserFileChanges, setNonUserFileChanges] = React.useState<FileChange[]>([]);

    React.useEffect(() => {
        const handleFileChangesChange = (fileChanges: FileChange[]) => {
            const username = environmentService.getUsername();
            setNonUserFileChanges(fileChanges.filter(change => change.user !== username));
        };
        const unsubscribeFunc = AppMessageBus.fileChanges.subscribe(
            FileChangesTopics.FILES_CHANGED,
            handleFileChangesChange
        );

        return unsubscribeFunc;
    }, []);

    return nonUserFileChanges;
};
