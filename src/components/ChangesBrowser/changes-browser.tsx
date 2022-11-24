import {Edit} from "@mui/icons-material";
import {
    Button,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {useChangelogWatcher} from "@services/changelog-service";
import {useEnvironment} from "@services/environment-service";
import {useFileChangesWatcher} from "@services/file-changes-service";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {useAppSelector} from "@redux/hooks";

import {ICommit} from "@shared-types/changelog";
import {FileChange} from "@shared-types/file-changes";

import path from "path";
import {v4} from "uuid";

import "./changes-browser.css";

export const ChangesBrowser: React.VFC = () => {
    const [stagedFiles, setStagedFiles] = React.useState<string[]>([]);
    const [commitMessage, setCommitMessage] = React.useState<string>("");
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
            return path.relative(path.join(directory, ".users", environment.username), filePath);
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
        if (fileManager.fileManager.commitFileChanges(stagedFiles)) {
            const commit: ICommit = {
                id: v4(),
                author: environment.username,
                message: commitMessage,
                datetime: new Date(),
                files: stagedFiles.map(el => adjustFilePath(el)),
            };
            changelog.appendCommit(commit);
            setCommitMessage("");
            setStagedFiles([]);
        }
    }, [stagedFiles, fileManager, environment, changelog, commitMessage, adjustFilePath]);

    return (
        <Paper elevation={4} className="ChangesBrowser">
            <Stack direction="column" spacing={2} sx={{width: "100%"}}>
                {userFileChanges.length > 0 && (
                    <Typography variant="h6">{userFileChanges.length} file change(s)</Typography>
                )}
                <List
                    component="nav"
                    aria-labelledby="nested-list-subheader"
                    sx={{width: "100%"}}
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            Unstaged files
                        </ListSubheader>
                    }
                >
                    {userFileChanges
                        .filter(el => !stagedFiles.includes(el.filePath))
                        .map(fileChange => (
                            <ListItemButton onClick={() => handleCommitChange(fileChange.filePath)}>
                                <ListItemIcon>
                                    <Edit color="success" />
                                </ListItemIcon>
                                <ListItemText primary={adjustFilePath(fileChange.filePath)} />
                            </ListItemButton>
                        ))}
                </List>
                <List
                    component="nav"
                    aria-labelledby="nested-list-subheader"
                    sx={{width: "100%"}}
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            Staged files
                        </ListSubheader>
                    }
                >
                    {userFileChanges
                        .filter(el => stagedFiles.includes(el.filePath))
                        .map(fileChange => (
                            <ListItemButton>
                                <ListItemIcon>
                                    <Edit color="success" />
                                </ListItemIcon>
                                <ListItemText primary={adjustFilePath(fileChange.filePath)} />
                            </ListItemButton>
                        ))}
                </List>
                <TextField
                    id="outlined-textarea"
                    label="Commit message"
                    placeholder="Summary"
                    multiline
                    rows={10}
                    onChange={e => setCommitMessage(e.target.value)}
                    value={commitMessage}
                />
                <Button onClick={() => handleCommit()}>Commit changes</Button>
            </Stack>
        </Paper>
    );
};
