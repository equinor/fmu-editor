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

export const Explorer: React.FC = () => {
    const fmuDirectoryPath = useAppSelector(state => state.files.fmuDirectory);
    const workingDirectoryPath = useAppSelector(state => state.files.directory);
    const [fmuDirectory, setFmuDirectory] = React.useState<Directory | null>(null);
    const [directory, setDirectory] = React.useState<Directory | null>(null);
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

    const refreshTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const dispatch = useAppDispatch();
    const theme = useTheme();

    React.useEffect(() => {
        if (workingDirectoryPath !== undefined && workingDirectoryPath !== "") {
            try {
                setDirectory(new Directory("", workingDirectoryPath));
            } catch (e) {
                const notification: Notification = {
                    type: NotificationType.ERROR,
                    message: `Could not read content of '${workingDirectoryPath}'. ${e}`,
                };
                dispatch(addNotification(notification));
            }
        }
    }, [workingDirectoryPath, dispatch]);

    React.useEffect(() => {
        if (refreshTimer.current) {
            clearInterval(refreshTimer.current);
        }
        if (fmuDirectoryPath !== undefined && fmuDirectoryPath !== "" && drawerOpen) {
            setFmuDirectory(new Directory("", fmuDirectoryPath));
            refreshTimer.current = setInterval(() => {
                setFmuDirectory(new Directory("", fmuDirectoryPath));
            }, 3000);
        }
    }, [fmuDirectoryPath, drawerOpen]);

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectoryPath, dispatch);
    };

    const handleCollapseAll = () => {
        dispatch(setFileTreeStates([]));
    };

    const handleWorkingDirectoryChange = (dir: string) => {
        dispatch(setWorkingDirectoryPath({path: dir}));
        setDrawerOpen(false);
    };

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event.type === "keydown" &&
            ((event as React.KeyboardEvent).key === "Tab" || (event as React.KeyboardEvent).key === "Shift")
        ) {
            return;
        }

        setDrawerOpen(open);
    };

    return (
        <Surface elevation="raised" className="Explorer">
            <Drawer open={drawerOpen} onClose={toggleDrawer(false)}>
                <List className="DirectoryDrawer">
                    {fmuDirectory !== null &&
                        fmuDirectory.getContent().map(el => (
                            <ListItem key={el.absolutePath()} disablePadding>
                                <ListItemButton onClick={() => handleWorkingDirectoryChange(el.absolutePath())}>
                                    <ListItemIcon>
                                        {directory !== null && el.absolutePath() === directory.absolutePath() && (
                                            <VscCheck fontSize="small" color="var(--text-on-primary)" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText>{el.baseName()}</ListItemText>
                                </ListItemButton>
                            </ListItem>
                        ))}
                </List>
            </Drawer>
            {fmuDirectoryPath === undefined || fmuDirectoryPath === "" ? (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <Button variant="contained" onClick={handleOpenDirectoryClick}>
                        Select FMU Directory
                    </Button>
                    <Typography>In order to start using the editor, please select your FMU directory.</Typography>
                </Stack>
            ) : directory === null ? (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <Button variant="contained" onClick={toggleDrawer(true)}>
                        Select Working Directory
                    </Button>
                    <Typography>In order to start using the editor, please select your working directory.</Typography>
                </Stack>
            ) : (
                <>
                    <Surface elevation="raised">
                        <Stack direction="row" alignItems="center" className="ExplorerTitle">
                            <div>
                                {directory.baseName()}
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
                            return (
                                <DirectoryComponent level={1} directory={item as Directory} key={item.relativePath()} />
                            );
                        })}
                    </div>
                </>
            )}
        </Surface>
    );
};
