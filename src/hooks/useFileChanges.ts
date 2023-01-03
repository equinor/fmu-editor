import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";

import {FileChange, FileChangeOrigin} from "@shared-types/file-changes";

export const useFileChanges = (origins: FileChangeOrigin[] | FileChangeOrigin, user?: string): FileChange[] => {
    const [fileChanges, setFileChanges] = React.useState<FileChange[]>([]);

    const fileChangesWatcher = useFileChangesWatcher();
    const {username} = useEnvironment();

    React.useEffect(() => {
        const adjustedOrigins = Array.isArray(origins) ? origins : [origins];
        setFileChanges(
            fileChangesWatcher.fileChanges.filter(
                change => change.user === (user || username) && adjustedOrigins.includes(change.origin)
            )
        );
    }, [fileChangesWatcher.fileChanges, username, user, origins]);

    return fileChanges;
};
