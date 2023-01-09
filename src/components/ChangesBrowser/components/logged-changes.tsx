import {IDynamicPerson} from "@microsoft/mgt-react";
import {Add, Edit, Remove} from "@mui/icons-material";
import {Stack, Typography} from "@mui/material";
import {useEnvironment} from "@services/environment-service";

import React from "react";
import {VscGitCommit} from "react-icons/vsc";

import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDiffFiles} from "@redux/reducers/ui";

// import {ICommit} from "@shared-types/changelog";
import {FileChangeOrigin, FileChangeType} from "@shared-types/file-changes";

import path from "path";

export const LoggedChanges: React.VFC = () => {
    const [summarizedActions, setSummarizedActions] = React.useState<{[key: string]: number}>({
        [FileChangeType.ADDED]: 0,
        [FileChangeType.MODIFIED]: 0,
        [FileChangeType.DELETED]: 0,
    });
    const [userDetails, setUserDetails] = React.useState<IDynamicPerson | null>(null);

    const currentCommit = useAppSelector(state => state.ui.currentCommit);
    const dispatch = useAppDispatch();
    const environment = useEnvironment();
    const diffMainFile = useAppSelector(state => state.ui.diffMainFile);
    const directory = useAppSelector(state => state.files.directory);

    React.useEffect(() => {
        const counts = {
            [FileChangeType.ADDED]: 0,
            [FileChangeType.MODIFIED]: 0,
            [FileChangeType.DELETED]: 0,
        };
        if (currentCommit) {
            currentCommit.files.forEach(change => {
                counts[change.action]++;
            });
        }
        setSummarizedActions(counts);
    }, [currentCommit, environment]);

    const handleFileSelected = React.useCallback(
        (file: string) => {
            const mainFile = currentCommit.compareSnapshotPath
                ? path.relative(directory, path.join(currentCommit.compareSnapshotPath, file))
                : path.relative(directory, path.join(directory, file));
            dispatch(setDiffFiles({mainFile, userFile: file, origin: FileChangeOrigin.USER}));
        },
        [dispatch, directory, currentCommit]
    );

    if (!currentCommit) {
        return (
            <Stack direction="column" className="ChangesBrowserNoContent" spacing={2}>
                <VscGitCommit size={40} />
                <Typography variant="body2">Please select a commit to show its details.</Typography>
            </Stack>
        );
    }

    return (
        <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
            <div className="ChangesBrowserContentHeader" title={currentCommit.id}>
                Commit: {currentCommit.id}
            </div>
            <div className="ChangesBrowserText">{currentCommit.message}</div>
            <div className="ChangesBrowserUser">
                <Avatar user={currentCommit.author} size={40} getDetails={(_, details) => setUserDetails(details)} />
                <div>
                    <div className="TextOverflow" title={userDetails?.displayName || currentCommit.author}>
                        {userDetails?.displayName || currentCommit.author}
                    </div>
                    <div className="ChangesBrowserDate">
                        authored {new Date(currentCommit.datetime).toLocaleDateString()}
                        {" @ "}
                        {new Date(currentCommit.datetime).toLocaleTimeString()}
                    </div>
                </div>
            </div>
            <Stack direction="row" spacing={1}>
                <Edit color="warning" fontSize="small" />
                <span>{summarizedActions[FileChangeType.MODIFIED]} modified</span>
                <Add color="success" fontSize="small" />
                <span>{summarizedActions[FileChangeType.ADDED]} added</span>
                <Remove color="error" fontSize="small" />
                <span>{summarizedActions[FileChangeType.DELETED]} deleted</span>
            </Stack>
            <div className="ChangesBrowserList">
                {currentCommit.files.map(fileChange => (
                    <div
                        className={`ChangesBrowserListItem${
                            fileChange.path === diffMainFile ? " ChangesBrowserListItemSelected" : ""
                        }`}
                        key={fileChange.path}
                        onClick={() => handleFileSelected(fileChange.path)}
                    >
                        <div>
                            {fileChange.action === FileChangeType.MODIFIED && <Edit color="warning" fontSize="small" />}
                            {fileChange.action === FileChangeType.ADDED && <Add color="success" fontSize="small" />}
                            {fileChange.action === FileChangeType.DELETED && <Remove color="error" fontSize="small" />}
                            <span title={fileChange.path}>{fileChange.path}&lrm;</span>
                        </div>
                    </div>
                ))}
            </div>
        </Stack>
    );
};
