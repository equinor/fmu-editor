import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";

import {FileChange} from "@shared-types/file-changes";

export const useNonUserFileChanges = (): FileChange[] => {
    const [nonUserFileChanges, setNonUserFileChanges] = React.useState<FileChange[]>([]);

    const fileChangesWatcher = useFileChangesWatcher();
    const environment = useEnvironment();

    React.useEffect(() => {
        setNonUserFileChanges(fileChangesWatcher.fileChanges.filter(change => change.user !== environment.username));
    }, [fileChangesWatcher.fileChanges, environment.username]);

    return nonUserFileChanges;
};
