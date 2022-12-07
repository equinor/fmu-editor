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
import {VscCheck, VscCollapseAll, VscFolderActive, VscLock} from "react-icons/vsc";

import {checkIfWritable, readFileTree} from "@utils/file-operations";

import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDirectory, setFileTreeStates} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {selectFmuDirectory} from "@redux/thunks";

import {FileTree} from "@shared-types/file-tree";
import {Notification, NotificationType} from "@shared-types/notifications";

import fs from "fs";

import {Directory} from "./components/directory";
import "./explorer.css";

const readDirectories = (fmuDirectory: string): string[] => {
    return fs
        .readdirSync(fmuDirectory)
        .filter(file => fs.statSync(`${fmuDirectory}/${file}`).isDirectory())
        .reverse();
};

export const Explorer: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const directory = useAppSelector(state => state.files.directory);
    const [writeable, setWriteable] = React.useState<boolean>(false);
    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const [fileTree, setFileTree] = React.useState<FileTree>([]);
    const [allCollapsed, setAllCollapsed] = React.useState<number>(0);
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const [directories, setDirectories] = React.useState<string[]>([]);

    const refreshTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const dispatch = useAppDispatch();
    const theme = useTheme();

    React.useEffect(() => {
        if (directory !== undefined && directory !== "") {
            try {
                setFileTree(readFileTree(directory));
                setWriteable(checkIfWritable(directory));
            } catch (e) {
                const notification: Notification = {
                    type: NotificationType.ERROR,
                    message: `Could not read content of '${directory}'. ${e}`,
                };
                dispatch(addNotification(notification));
            }
        }
    }, [directory, dispatch]);

    React.useEffect(() => {
        if (refreshTimer.current) {
            clearInterval(refreshTimer.current);
        }
        if (fmuDirectory !== undefined && fmuDirectory !== "" && drawerOpen) {
            setDirectories(readDirectories(fmuDirectory));
            refreshTimer.current = setInterval(() => {
                setDirectories(readDirectories(fmuDirectory));
            }, 3000);
        }
    }, [fmuDirectory, drawerOpen]);

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectory, dispatch);
    };

    const handleCollapseAll = () => {
        dispatch(setFileTreeStates([]));
    };

    const handleDirectoryChange = (dir: string) => {
        dispatch(setDirectory({path: `${fmuDirectory}/${dir}`}));
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
                    {directories.map(el => (
                        <ListItem key={el} disablePadding>
                            <ListItemButton onClick={() => handleDirectoryChange(el)}>
                                <ListItemIcon>
                                    {`${fmuDirectory}/${el}` === directory && (
                                        <VscCheck fontSize="small" color="var(--text-on-primary)" />
                                    )}
                                </ListItemIcon>
                                <ListItemText>{el}</ListItemText>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            {fmuDirectory === undefined || fmuDirectory === "" ? (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <Button variant="contained" onClick={handleOpenDirectoryClick}>
                        Select FMU Directory
                    </Button>
                    <Typography>In order to start using the editor, please select your FMU directory.</Typography>
                </Stack>
            ) : directory === undefined || directory === "" ? (
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
                                {directory.split("/")[directory.split("/").length - 1]}
                                {!writeable && (
                                    <VscLock
                                        color={theme.palette.warning.main}
                                        title="You don't have write access for this folder."
                                    />
                                )}
                            </div>
                            <IconButton size="small" title="Change directory" onClick={toggleDrawer(true)}>
                                <VscFolderActive />
                            </IconButton>
                            <IconButton size="small" title="Collapse all" onClick={() => handleCollapseAll()}>
                                <VscCollapseAll />
                            </IconButton>
                        </Stack>
                    </Surface>
                    <div className="ExplorerContent">
                        {fileTree.map((item, index) => {
                            if (item.type === "file") {
                                return (
                                    <div className="ExplorerItem" key={item.name} style={{paddingLeft: 16}}>
                                        {item.name}
                                    </div>
                                );
                            }
                            return (
                                <Directory
                                    level={1}
                                    path={item.name}
                                    name={item.name}
                                    content={item.children}
                                    key={item.name}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </Surface>
    );
};
