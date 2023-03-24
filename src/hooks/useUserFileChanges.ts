import {environmentService} from "@services/environment-service";
import {FileChangesTopics} from "@services/file-changes-service";

import React from "react";

import {AppMessageBus} from "@src/framework/app-message-bus";

import {FileChange, FileChangeOrigin} from "@shared-types/file-changes";

export const useUserFileChanges = (): FileChange[] => {
    const [userFileChanges, setUserFileChanges] = React.useState<FileChange[]>([]);

    React.useEffect(() => {
        const handleUserFileChangesChange = ({fileChanges}: {fileChanges: FileChange[]}) => {
            const username = environmentService.getUsername();
            setUserFileChanges(
                fileChanges.filter(change => change.user === username && change.origin !== FileChangeOrigin.MAIN)
            );
        };

        const unsubscribeFunc = AppMessageBus.fileChanges.subscribe(
            FileChangesTopics.FILES_CHANGED,
            handleUserFileChangesChange,
            true
        );

        return unsubscribeFunc;
    }, []);

    return userFileChanges;
};
