import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";

import {FileChange, FileChangeOrigin} from "@shared-types/file-changes";

export const useOngoingChangesForFile = (relativeFilePath: string): FileChange[] => {
    const [ongoingChanges, setOngoingChanges] = React.useState<FileChange[]>([]);

    const fileChangesWatcher = useFileChangesWatcher();
    const {username} = useEnvironment();

    React.useEffect(() => {
        setOngoingChanges(
            fileChangesWatcher.fileChanges.filter(
                change =>
                    change.relativePath === relativeFilePath &&
                    change.user !== username &&
                    [FileChangeOrigin.USER, FileChangeOrigin.BOTH].includes(change.origin)
            )
        );
    }, [fileChangesWatcher.fileChanges, username, relativeFilePath]);

    return ongoingChanges;
};
