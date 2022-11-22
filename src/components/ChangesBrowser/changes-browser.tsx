import {Edit} from "@mui/icons-material";
import {
    Button,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import {useEnvironment} from "@services/environment-service";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {useAppSelector} from "@redux/hooks";

import {FileChange} from "@shared-types/file-changes";

import path from "path";

import "./changes-browser.css";

type MyFileChange = FileChange & {commit: boolean};

export const ChangesBrowser: React.VFC = () => {
    const [myFileChanges, setMyFileChanges] = React.useState<MyFileChange[]>([]);

    const fileChanges = useAppSelector(state => state.files.fileChanges);
    const directory = useAppSelector(state => state.files.directory);
    const environment = useEnvironment();
    const fileManager = useFileManager();

    React.useEffect(() => {
        setMyFileChanges(
            fileChanges.filter(el => el.user === environment.username).map(el => ({...el, commit: false}))
        );
    }, [fileChanges, environment]);

    const adjustFilePath = React.useCallback(
        (filePath: string) => {
            return filePath.replace(path.join(directory, ".users", environment.username), "");
        },
        [environment.username, directory]
    );

    const handleCommitChange = React.useCallback((filePath: string) => {
        setMyFileChanges(prev =>
            prev.map(el => {
                if (el.filePath === filePath) {
                    return {...el, commit: !el.commit};
                }
                return el;
            })
        );
    }, []);

    const handleCommit = React.useCallback(() => {
        fileManager.fileManager.commitFileChanges(myFileChanges.filter(el => el.commit).map(el => el.filePath));
    }, [myFileChanges, fileManager]);

    return (
        <Paper elevation={4} className="ChangesBrowser">
            {myFileChanges.length > 0 && <Typography variant="h6">{myFileChanges.length} file change(s)</Typography>}
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
                {myFileChanges
                    .filter(el => !el.commit)
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
                {myFileChanges
                    .filter(el => el.commit)
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
                sx={{minHeight: 300}}
            />
            <Button onClick={() => handleCommit()}>Commit changes</Button>
        </Paper>
    );
};
