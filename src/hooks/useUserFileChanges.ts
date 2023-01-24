import {useEnvironment} from "@services/environment-service";

import React from "react";

import { FileChange, FileChangeOrigin } from "@shared-types/file-changes";
import { useFileChangesWatcher } from "@services/file-changes-service";

export const useUserFileChanges = (): FileChange[] => {
    const [userFileChanges, setUserFileChanges] = React.useState<FileChange[]>([]);

    const fileChangesWatcher = useFileChangesWatcher();
    const environment = useEnvironment();

    React.useEffect(() => {
        setUserFileChanges(fileChangesWatcher.fileChanges.filter(change => change.user === environment.username && change.origin !== FileChangeOrigin.MAIN));
    }, [fileChangesWatcher.fileChanges, environment.username]);

    return userFileChanges;
};
