import {Edit} from "@mui/icons-material";
import {Button, CircularProgress, Stack} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";
import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {Input} from "@components/Input";
import {Surface} from "@components/Surface";

import {useAppSelector} from "@redux/hooks";

import {ICommit} from "@shared-types/changelog";
import {FileChange} from "@shared-types/file-changes";

import path from "path";
import {v4} from "uuid";

import "./changes-browser.css";

export const ChangesBrowser: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);
    const [commitSummary, setCommitSummary] = React.useState<string>("");
    const [commitDescription, setCommitDescription] = React.useState<string>("");
    const [userFileChanges, setUserFileChanges] = React.useState<FileChange[]>([]);

    const fileChangesWatcher = useFileChangesWatcher();
    const directory = useAppSelector(state => state.files.directory);
    const environment = useEnvironment();
    const fileManager = useFileManager();
    const changelog = useChangelogWatcher();

    React.useEffect(() => {
        setUserFileChanges(fileChangesWatcher.fileChanges.filter(change => change.user === environment.username));
    }, [fileChangesWatcher.fileChanges, environment.username]);

    React.useEffect(() => {
        setStagedFiles(prev => prev.filter(el => userFileChanges.some(change => change.filePath === el)));
    }, [userFileChanges, environment]);

    const adjustFilePath = React.useCallback(
        (filePath: string) => {
            return path.relative(path.join(directory, ".users", environment.username || ""), filePath);
        },
        [environment.username, directory]
    );

    const handleCommitChange = React.useCallback(
        (filePath: string) => {
            if (stagedFiles.includes(filePath)) {
                setStagedFiles(prev => prev.filter(el => el !== filePath));
            } else {
                setStagedFiles(prev => [...prev, filePath]);
            }
        },
        [stagedFiles]
    );

    const handleCommit = React.useCallback(() => {
        if (fileManager.fileManager.commitFileChanges(stagedFiles) && environment.username) {
            const commit: ICommit = {
                id: v4(),
                author: environment.username,
                message: [commitSummary, commitDescription].join("\n"),
                datetime: new Date(),
                files: stagedFiles.map(el => adjustFilePath(el)),
            };
            changelog.appendCommit(commit);
            setCommitSummary("");
            setCommitDescription("");
            setStagedFiles([]);
        }
    }, [stagedFiles, fileManager, environment, changelog, commitSummary, commitDescription, adjustFilePath]);

    const loadingOrError = React.useCallback(() => {
        if (environment.username === null) {
            if (!environment.usernameError) {
                return <CircularProgress />;
            }
            return <div>Could not load username from environment.</div>;
        }
        return null;
    }, [environment.username, environment.usernameError]);

    return (
        <Surface elevation="raised" className="ChangesBrowser">
            {loadingOrError()}
            {environment.username !== null && (
                <>
                    {userFileChanges.length > 0 && (
                        <Surface elevation="raised" className="ChangesBrowserHeader">
                            {userFileChanges.length} file change{userFileChanges.length > 1 && "s"} to commit
                        </Surface>
                    )}
                    <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                        <div className="ChangesBrowserContentHeader">
                            Unstaged Files ({userFileChanges.filter(el => !stagedFiles.includes(el.filePath)).length})
                        </div>
                        <div className="ChangesBrowserList">
                            {userFileChanges
                                .filter(el => !stagedFiles.includes(el.filePath))
                                .map(fileChange => (
                                    <div className="ChangesBrowserListItem" key={fileChange.filePath}>
                                        <div>
                                            <Edit color="success" fontSize="small" />
                                            <span>{adjustFilePath(fileChange.filePath)}</span>
                                        </div>
                                        <Button
                                            variant="text"
                                            onClick={() => handleCommitChange(fileChange.filePath)}
                                            size="small"
                                        >
                                            Stage File
                                        </Button>
                                    </div>
                                ))}
                        </div>
                        <div className="ChangesBrowserContentHeader">Staged Files ({stagedFiles.length})</div>
                        <div className="ChangesBrowserList">
                            {userFileChanges
                                .filter(el => stagedFiles.includes(el.filePath))
                                .map(fileChange => (
                                    <div className="ChangesBrowserListItem" key={fileChange.filePath}>
                                        <div>
                                            <Edit color="success" fontSize="small" />
                                            <span>{adjustFilePath(fileChange.filePath)}</span>
                                        </div>
                                        <Button
                                            variant="text"
                                            onClick={() => handleCommitChange(fileChange.filePath)}
                                            size="small"
                                        >
                                            Unstage File
                                        </Button>
                                    </div>
                                ))}
                        </div>
                        <div className="ChangesBrowserContentHeader">Commit Message</div>
                        <Stack direction="column" spacing={0}>
                            <Input
                                placeholder="Summary"
                                onChange={e => setCommitSummary(e.target.value)}
                                value={commitSummary}
                                maxLength={70}
                            />
                            <Input
                                placeholder="Description"
                                multiline
                                rows={5}
                                onChange={e => setCommitDescription(e.target.value)}
                                value={commitDescription}
                                fontSize="0.98rem"
                            />
                        </Stack>
                        <Button
                            onClick={() => handleCommit()}
                            disabled={stagedFiles.length === 0 || commitSummary.length === 0}
                            variant="contained"
                        >
                            Commit changes
                        </Button>
                    </Stack>
                </>
            )}
        </Surface>
    );
};
