import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";

import {FileChange} from "@shared-types/file-changes";

export const useOngoingChangesForFile = (filePath: string): FileChange[] => {
    const [ongoingChanges, setOngoingChanges] = React.useState<FileChange[]>([]);

    const fileChangesWatcher = useFileChangesWatcher();
    const environment = useEnvironment();

    React.useEffect(() => {
        setOngoingChanges(
            fileChangesWatcher.fileChanges.filter(
                change => change.filePath === filePath && change.user !== environment.username
            )
        );
    }, [fileChangesWatcher.fileChanges, environment.username, filePath]);

    return ongoingChanges;
};
