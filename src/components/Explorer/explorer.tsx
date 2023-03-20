import {LoadingButton} from "@mui/lab";
import {
    CircularProgress,
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
import {useEnvironmentService} from "@services/environment-service";
import {FileSystemWatcherMessageTypes, fileSystemWatcherService} from "@services/file-system-service";

import React from "react";
import {VscCheck, VscChevronDown, VscCollapseAll, VscLock, VscNewFile, VscNewFolder, VscRefresh} from "react-icons/vsc";

import {AppMessageBus} from "@src/framework/app-message-bus";

import {Directory} from "@utils/file-system/directory";

import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setFileTreeStates, setWorkingDirectoryPath} from "@redux/reducers/files";
import {setActiveItemPath, setCreateFile, setCreateFolder} from "@redux/reducers/ui";
import {selectFmuDirectory} from "@redux/thunks";

import path from "path";

import {DirectoryComponent} from "./components/directory-component";
import "./explorer.css";

export const Explorer: React.FC = () => {
    const fmuDirectoryPath = useAppSelector(state => state.files.fmuDirectoryPath);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const {username} = useEnvironmentService();
    const [fmuDirectory, setFmuDirectory] = React.useState<Directory | null>(null);
    const [workingDirectory, setWorkingDirectory] = React.useState<Directory | null>(null);
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);

    const explorerRef = React.useRef<HTMLDivElement | null>(null);

    const dispatch = useAppDispatch();
    const theme = useTheme();
    const activeItemPath = useAppSelector(state => state.ui.explorer.activeItemPath);

    React.useEffect(() => {
        const relativePath = path.relative(workingDirectoryPath, activeItemPath);
        if (
            workingDirectoryPath &&
            username &&
            (activeItemPath === "" || (relativePath.startsWith("..") && !path.isAbsolute(relativePath)))
        ) {
            dispatch(
                setActiveItemPath(new Directory("", workingDirectoryPath).getUserVersion(username).absolutePath())
            );
        }
    }, [workingDirectoryPath, username, dispatch, activeItemPath]);

    React.useEffect(() => {
        const handleWorkingDirectoriesChange = () => {
            const dir = new Directory("", fmuDirectoryPath);
            if (dir.exists()) {
                setFmuDirectory(dir);
            } else {
                setFmuDirectory(null);
            }
        };

        setLoading(false);
        handleWorkingDirectoriesChange();

        const unsubscribeFunc = AppMessageBus.fileSystem.subscribe(
            FileSystemWatcherMessageTypes.AVAILABLE_WORKING_DIRECTORIES_CHANGED,
            handleWorkingDirectoriesChange
        );

        return unsubscribeFunc;
    }, [fmuDirectoryPath]);

    const refreshExplorer = React.useCallback(() => {
        if (workingDirectoryPath !== "" && username) {
            const dir = new Directory("", workingDirectoryPath);
            if (!dir.exists()) {
                setWorkingDirectory(null);
                return;
            }
            setWorkingDirectory(dir.getUserVersion(username));
        }
    }, [workingDirectoryPath, username]);

    React.useEffect(() => {
        refreshExplorer();
        setLoading(false);
    }, [refreshExplorer, workingDirectoryPath, username]);

    React.useEffect(() => {
        const unsubscribeFunc = fileSystemWatcherService
            .getMessageBus()
            .subscribe(FileSystemWatcherMessageTypes.WORKING_DIRECTORY_CONTENT_CHANGED, refreshExplorer);

        return unsubscribeFunc;
    }, [refreshExplorer]);

    const handleWorkingDirectoryChange = (dir: string) => {
        dispatch(setWorkingDirectoryPath({path: dir}));
        setLoading(true);
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
        const handleOpenDirectoryClick = async () => {
            setLoading(true);
            const success = await selectFmuDirectory(fmuDirectoryPath, dispatch);
            if (!success) {
                setLoading(false);
            }
        };

        const handleCollapseAll = () => {
            dispatch(setFileTreeStates([]));
        };

        if (fmuDirectory === null || fmuDirectoryPath === "" || !fmuDirectory.exists()) {
            return (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <LoadingButton variant="contained" onClick={handleOpenDirectoryClick} loading={loading}>
                        Select FMU Model Directory
                    </LoadingButton>
                    <Typography>In order to start using the editor, please select your FMU model directory.</Typography>
                    <Typography>Example:
                        <strong> /project/your_project/resmod/ff</strong>
                    </Typography>
                </Stack>
            );
        }
        if (workingDirectory === null || workingDirectoryPath === "" || !workingDirectory.exists()) {
            return (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <LoadingButton variant="contained" onClick={toggleDrawer(true)} loading={loading}>
                        Select Model Version
                    </LoadingButton>
                    <Typography>In order to start using the editor, please select your model version.</Typography>
                </Stack>
            );
        }

        return (
            <>
                <Surface elevation="raised">
                    <Stack direction="row" alignItems="center" className="ExplorerTitle">
                        <div>
                            {workingDirectory.getMainVersion().baseName()}
                            {!workingDirectory.getMainVersion().isWritable() && (
                                <VscLock
                                    color={theme.palette.warning.main}
                                    title="You don't have write access for this folder."
                                />
                            )}
                            <IconButton size="small" title="Change working directory" onClick={toggleDrawer(true)}>
                                <VscChevronDown />
                            </IconButton>
                        </div>
                        <IconButton
                            size="small"
                            title="Create new file..."
                            onClick={() => dispatch(setCreateFile(true))}
                        >
                            <VscNewFile />
                        </IconButton>
                        <IconButton
                            size="small"
                            title="Create new folder..."
                            onClick={() => dispatch(setCreateFolder(true))}
                        >
                            <VscNewFolder />
                        </IconButton>
                        <IconButton size="small" title="Refresh" onClick={() => refreshExplorer()}>
                            <VscRefresh />
                        </IconButton>
                        <IconButton size="small" title="Collapse all" onClick={() => handleCollapseAll()}>
                            <VscCollapseAll />
                        </IconButton>
                    </Stack>
                </Surface>
                <div className="ExplorerContent" ref={explorerRef}>
                    {workingDirectory.exists() ? (
                        <DirectoryComponent
                            level={0}
                            directory={workingDirectory}
                            key={workingDirectory.relativePath()}
                            rootDirectory
                        />
                    ) : (
                        <Stack className="ExplorerNoDirectory" spacing={2}>
                            <CircularProgress />
                            <Typography>Creating a copy of the working directory for you...</Typography>
                        </Stack>
                    )}
                </div>
            </>
        );
    }, [
        theme,
        toggleDrawer,
        dispatch,
        explorerRef,
        refreshExplorer,
        fmuDirectoryPath,
        fmuDirectory,
        workingDirectoryPath,
        workingDirectory,
        loading,
    ]);

    return (
        <Surface elevation="raised" className="Explorer">
            <Drawer open={drawerOpen} onClose={toggleDrawer(false)}>
                <List className="DirectoryDrawer">
                    {fmuDirectory !== null && fmuDirectory
                        .getContent()
                        .filter(el => el.isDirectory())
                        .map(el => (
                            <ListItem key={el.absolutePath()} disablePadding>
                                <ListItemButton onClick={() => handleWorkingDirectoryChange(el.absolutePath())}>
                                    <ListItemIcon>
                                        {workingDirectory !== null &&
                                            el.absolutePath() === workingDirectory.getMainVersion().absolutePath() && (
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
