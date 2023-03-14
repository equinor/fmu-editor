import {AppMessageBus} from "@framework/app-message-bus";
import {environmentService} from "@services/environment-service";
import {FileChangesTopics} from "@services/file-changes-service";

import React from "react";

import {FileChange, FileChangeOrigin} from "@shared-types/file-changes";

export const useOngoingChangesForFile = (relativeFilePath: string): FileChange[] => {
    const [ongoingChanges, setOngoingChanges] = React.useState<FileChange[]>([]);

    React.useEffect(() => {
        const handleFileChangesChange = ({fileChanges}: {fileChanges: FileChange[]}) => {
            const username = environmentService.getUsername();
            setOngoingChanges(
                fileChanges.filter(
                    change =>
                        change.relativePath === relativeFilePath &&
                        change.user !== username &&
                        [FileChangeOrigin.USER, FileChangeOrigin.BOTH].includes(change.origin)
                )
            );
        };

        const unsubscribeFunc = AppMessageBus.fileChanges.subscribe(
            FileChangesTopics.FILES_CHANGED,
            handleFileChangesChange
        );

        return unsubscribeFunc;
    }, [relativeFilePath]);

    return ongoingChanges;
};
