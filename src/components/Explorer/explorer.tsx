import {
    Button,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";

import React from "react";
import {VscCheck, VscChevronDown, VscCollapseAll, VscLock} from "react-icons/vsc";

import {Directory} from "@utils/file-system/directory";

import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setFileTreeStates, setWorkingDirectoryPath} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {selectFmuDirectory} from "@redux/thunks";

import {Notification, NotificationType} from "@shared-types/notifications";

import {DirectoryComponent} from "./components/directory-component";
import "./explorer.css";

import {useEnvironment} from "../../services/environment-service";

export const Explorer: React.FC = () => {
    const fmuDirectoryPath = useAppSelector(state => state.files.fmuDirectory);
    const workingDirectoryPath = useAppSelector(state => state.files.directory);
    const {username} = useEnvironment();
    const [fmuDirectory, setFmuDirectory] = React.useState<Directory | null>(null);
    const [directory, setDirectory] = React.useState<Directory | null>(null);
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

    const refreshFmuTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const refreshWorkingDirTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const dispatch = useAppDispatch();
    const theme = useTheme();

    React.useEffect(() => {
        if (workingDirectoryPath !== undefined && workingDirectoryPath !== "" && username) {
            try {
                setDirectory(new Directory("", workingDirectoryPath).getUserVersion(username));
            } catch (e) {
                const notification: Notification = {
                    type: NotificationType.ERROR,
                    message: `Could not read content of '${workingDirectoryPath}'. ${e}`,
                };
                dispatch(addNotification(notification));
            }
        }
    }, [workingDirectoryPath, dispatch, username]);

    React.useEffect(() => {
        if (refreshFmuTimer.current) {
            clearInterval(refreshFmuTimer.current);
        }
        if (fmuDirectoryPath !== undefined && fmuDirectoryPath !== "" && drawerOpen) {
            setFmuDirectory(new Directory("", fmuDirectoryPath));
            refreshFmuTimer.current = setInterval(() => {
                setFmuDirectory(new Directory("", fmuDirectoryPath));
            }, 3000);
        }
    }, [fmuDirectoryPath, drawerOpen]);

    React.useEffect(() => {
        if (refreshWorkingDirTimer.current) {
            clearInterval(refreshWorkingDirTimer.current);
        }
        if (workingDirectoryPath !== undefined && workingDirectoryPath !== "") {
            refreshWorkingDirTimer.current = setInterval(() => {
                setDirectory(new Directory("", workingDirectoryPath).getUserVersion(username));
            }, 3000);
        }
    }, [workingDirectoryPath, username]);

    const handleWorkingDirectoryChange = (dir: string) => {
        dispatch(setWorkingDirectoryPath({path: dir}));
        setDrawerOpen(false);
    };

    const toggleDrawer = React.useCallback(
        (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
            if (
                event.type === "keydown" &&
                ((event as React.KeyboardEvent).key === "Tab" || (event as React.KeyboardEvent).key === "Shift")
            ) {
                return;
            }

            setDrawerOpen(open);
        },
        []
    );

    const makeContent = React.useCallback(() => {
        const handleOpenDirectoryClick = () => {
            selectFmuDirectory(fmuDirectoryPath, dispatch);
        };

        const handleCollapseAll = () => {
            dispatch(setFileTreeStates([]));
        };

        if (username === undefined) {
            return (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <Button variant="contained" onClick={toggleDrawer(true)}>
                        Select Working Directory
                    </Button>
                    <Typography>In order to start using the editor, please select your working directory.</Typography>
                </Stack>
            );
        }
        if (fmuDirectoryPath === undefined || fmuDirectoryPath === "") {
            return (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <Button variant="contained" onClick={handleOpenDirectoryClick}>
                        Select FMU Directory
                    </Button>
                    <Typography>In order to start using the editor, please select your FMU directory.</Typography>
                </Stack>
            );
        }
        if (directory === null) {
            return (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <Button variant="contained" onClick={toggleDrawer(true)}>
                        Select Working Directory
                    </Button>
                    <Typography>In order to start using the editor, please select your working directory.</Typography>
                </Stack>
            );
        }
        return (
            <>
                <Surface elevation="raised">
                    <Stack direction="row" alignItems="center" className="ExplorerTitle">
                        <div>
                            {directory.getMainVersion().baseName()}
                            {!directory.isWritable() && (
                                <VscLock
                                    color={theme.palette.warning.main}
                                    title="You don't have write access for this folder."
                                />
                            )}
                            <IconButton size="small" title="Change working directory" onClick={toggleDrawer(true)}>
                                <VscChevronDown />
                            </IconButton>
                        </div>
                        <IconButton size="small" title="Collapse all" onClick={() => handleCollapseAll()}>
                            <VscCollapseAll />
                        </IconButton>
                    </Stack>
                </Surface>
                <div className="ExplorerContent">
                    {directory.getContent().map(item => {
                        if (!item.isDirectory()) {
                            return (
                                <div className="ExplorerItem" key={item.relativePath()} style={{paddingLeft: 16}}>
                                    {item.baseName()}
                                </div>
                            );
                        }
                        return <DirectoryComponent level={1} directory={item as Directory} key={item.relativePath()} />;
                    })}
                </div>
            </>
        );
    }, [username, directory, fmuDirectoryPath, theme, toggleDrawer, dispatch]);

    return (
        <Surface elevation="raised" className="Explorer">
            <Drawer open={drawerOpen} onClose={toggleDrawer(false)}>
                <List className="DirectoryDrawer">
                    {fmuDirectory !== null &&
                        fmuDirectory.getContent().map(el => (
                            <ListItem key={el.absolutePath()} disablePadding>
                                <ListItemButton onClick={() => handleWorkingDirectoryChange(el.absolutePath())}>
                                    <ListItemIcon>
                                        {directory !== null &&
                                            el.absolutePath() === directory.getMainVersion().absolutePath() && (
                                                <VscCheck fontSize="small" color="var(--text-on-primary)" />
                                            )}
                                    </ListItemIcon>
                                    <ListItemText>{el.baseName()}</ListItemText>
                                </ListItemButton>
                            </ListItem>
                        ))}
                </List>
            </Drawer>
            {makeContent()}
        </Surface>
    );
};
