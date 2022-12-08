import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";

import {FileChange} from "@shared-types/file-changes";

export const useUserChangesForFile = (filePath: string): FileChange[] => {
    const [userChanges, setUserChanges] = React.useState<FileChange[]>([]);

    const fileChangesWatcher = useFileChangesWatcher();
    const environment = useEnvironment();

    React.useEffect(() => {
        setUserChanges(
            fileChangesWatcher.fileChanges.filter(
                change => change.filePath === filePath && change.user !== environment.username
            )
        );
    }, [fileChangesWatcher.fileChanges, environment.username, filePath]);

    return userChanges;
};
