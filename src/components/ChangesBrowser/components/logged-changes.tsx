import {IDynamicPerson} from "@microsoft/mgt-react";
import {Add, Edit, Remove} from "@mui/icons-material";
import {Stack} from "@mui/material";
import {useEnvironment} from "@services/environment-service";

import React from "react";

import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveDiffFile} from "@redux/reducers/files";

// import {ICommit} from "@shared-types/changelog";
import {FileChangeType} from "@shared-types/file-changes";

export const LoggedChanges: React.VFC = () => {
    const [summarizedActions, setSummarizedActions] = React.useState<{[key: string]: number}>({
        [FileChangeType.ADDED]: 0,
        [FileChangeType.MODIFIED]: 0,
        [FileChangeType.DELETED]: 0,
    });
    const [userDetails, setUserDetails] = React.useState<IDynamicPerson | null>(null);

    const activeDiffFile = useAppSelector(state => state.files.activeDiffFile);
    const currentCommit = useAppSelector(state => state.ui.currentCommit);
    const dispatch = useAppDispatch();
    const environment = useEnvironment();

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
            dispatch(setActiveDiffFile({relativeFilePath: file}));
        },
        [dispatch]
    );

    return (
        <>
            {currentCommit && (
                <>
                    <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                        <div className="ChangesBrowserContentHeader" title={currentCommit.id}>
                            Commit: {currentCommit.id}
                        </div>
                        <div className="ChangesBrowserText">{currentCommit.message}</div>
                        <div className="ChangesBrowserUser">
                            <Avatar
                                user={currentCommit.author}
                                size={40}
                                getDetails={(_, details) => setUserDetails(details)}
                            />
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
                                        fileChange.path === activeDiffFile ? " ChangesBrowserListItemSelected" : ""
                                    }`}
                                    key={fileChange.path}
                                    onClick={() => handleFileSelected(fileChange.path)}
                                >
                                    <div>
                                        {fileChange.action === FileChangeType.MODIFIED && (
                                            <Edit color="warning" fontSize="small" />
                                        )}
                                        {fileChange.action === FileChangeType.ADDED && (
                                            <Add color="success" fontSize="small" />
                                        )}
                                        {fileChange.action === FileChangeType.DELETED && (
                                            <Remove color="error" fontSize="small" />
                                        )}
                                        <span title={fileChange.path}>{fileChange.path}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Stack>
                </>
            )}
        </>
    );
};
