import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Add, Edit, Remove} from "@mui/icons-material";
import {Avatar, Stack} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";
import {useEnvironment} from "@services/environment-service";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveDiffFile} from "@redux/reducers/files";

// import {ICommit} from "@shared-types/changelog";
import {FileChangeType} from "@shared-types/file-changes";

import path from "path";
import uniqolor from "uniqolor";

export const LoggedChanges: React.VFC = () => {
    const [summarizedActions, setSummarizedActions] = React.useState<{[key: string]: number}>({
        [FileChangeType.ADDED]: 0,
        [FileChangeType.MODIFIED]: 0,
        [FileChangeType.DELETED]: 0,
    });

    const userFileChanges = useUserFileChanges();
    const directory = useAppSelector(state => state.files.directory);
    const activeDiffFile = useAppSelector(state => state.files.activeDiffFile);
    const currentCommit = useAppSelector(state => state.ui.currentCommit);
    const dispatch = useAppDispatch();
    const environment = useEnvironment();
    const fileManager = useFileManager();
    const changelog = useChangelogWatcher();

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

    const adjustFilePath = React.useCallback(
        (filePath: string) => {
            return path.relative(path.join(directory, ".users", environment.username || ""), filePath);
        },
        [environment.username, directory]
    );

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
                        <div className="ChangesBrowserContentHeader">Commit: {currentCommit.id}</div>
                        <div className="ChangesBrowserText">{currentCommit.message}</div>
                        <div className="ChangesBrowserUser">
                            <Avatar
                                alt={currentCommit.author}
                                title={currentCommit.author}
                                src="/static/images/avatar/1.jpg"
                                sx={{width: 40, height: 40, backgroundColor: uniqolor(currentCommit.author).color}}
                            />
                            <div>
                                {currentCommit.author}
                                <br />
                                <span className="ChangesBrowserDate">
                                    authored {new Date(currentCommit.datetime).toLocaleDateString()}
                                    {" @ "}
                                    {new Date(currentCommit.datetime).toLocaleTimeString()}
                                </span>
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
