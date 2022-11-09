import {
    Button,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import React from "react";
import {VscCheck, VscCollapseAll, VscFolderActive} from "react-icons/vsc";

import {readFileTree} from "@utils/file-operations";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetFileTreeStates, setDirectory, setFileTreeStates} from "@redux/reducers/files";
import {selectFmuDirectory} from "@redux/thunks";

import {FileTree, FileTreeItem, FileTreeStates} from "@shared-types/file-tree";

import fs from "fs";

import {Directory} from "./components/directory";
import "./explorer.css";

export const Explorer: React.FC = () => {
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const directory = useAppSelector(state => state.files.directory);
    const fileTreeStates = useAppSelector(state => state.files.fileTreeStates[state.files.directory]);
    const [fileTree, setFileTree] = React.useState<FileTree>([]);
    const [allCollapsed, setAllCollapsed] = React.useState<number>(0);
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const [directories, setDirectories] = React.useState<string[]>([]);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (directory !== undefined && directory !== "") {
            setFileTree(readFileTree(directory));
        }
    }, [directory]);

    React.useEffect(() => {
        if (fmuDirectory !== undefined && fmuDirectory !== "") {
            setDirectories(
                fs
                    .readdirSync(fmuDirectory)
                    .filter(file => fs.statSync(`${fmuDirectory}/${file}`).isDirectory())
                    .reverse()
            );
        }
    }, [fmuDirectory]);

    const handleOpenDirectoryClick = () => {
        selectFmuDirectory(fmuDirectory, dispatch);
    };

    const handleCollapseAll = () => {
        setAllCollapsed(prev => prev + 1);
        dispatch(resetFileTreeStates());
    };

    const mapFileTree = (fileTreeElement: FileTree): FileTreeStates => {
        return fileTreeElement.map(el => ({
            expanded: false,
            children: el.children ? mapFileTree(el.children) : undefined,
        }));
    };

    const handleDirectoryChange = (dir: string) => {
        dispatch(setDirectory({path: `${fmuDirectory}/${dir}`}));
        setDrawerOpen(false);
    };

    const compareFileTreeStates = (states: FileTreeStates, tree: FileTree): boolean => {
        if (fileTreeStates.length !== fileTree.length) {
            return false;
        }
        let fileTreeItem: FileTreeItem | undefined;
        let equal = true;
        states.every((state, index) => {
            fileTreeItem = tree.at(index);

            if (fileTreeItem === undefined) {
                equal = false;
                return false;
            }

            if (state.children?.length !== fileTreeItem.children?.length) {
                equal = false;
                return false;
            }

            if (state.children && fileTreeItem.children) {
                if (!compareFileTreeStates(state.children, fileTreeItem.children)) {
                    equal = false;
                    return false;
                }
            }

            return true;
        });
        return equal;
    };

    const handleDirStateChange = (indices: number[], isExpanded: boolean) => {
        let newFileTreeStates: FileTreeStates | null = null;

        if (fileTreeStates) {
            newFileTreeStates = JSON.parse(JSON.stringify(fileTreeStates));
        }

        if (newFileTreeStates === null || !compareFileTreeStates(newFileTreeStates, fileTree)) {
            newFileTreeStates = mapFileTree(fileTree);
        }

        let current = newFileTreeStates;
        indices.forEach((index, i) => {
            if (i < indices.length - 1 && current[index].children !== undefined) {
                current = current[index].children as FileTreeStates;
            } else {
                current[index].expanded = isExpanded;
            }
        });
        dispatch(setFileTreeStates(newFileTreeStates));
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
        <Paper className="Explorer" elevation={3}>
            <Drawer open={drawerOpen} onClose={toggleDrawer(false)}>
                <List>
                    {directories.map(el => (
                        <ListItem key={el} disablePadding>
                            <ListItemButton onClick={() => handleDirectoryChange(el)}>
                                <ListItemIcon>
                                    {`${fmuDirectory}/${el}` === directory && <VscCheck fontSize="small" />}
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
            ) : (
                <>
                    <Paper elevation={3}>
                        <Stack direction="row" alignItems="center" className="ExplorerTitle">
                            <div style={{flexGrow: 4}}>{directory.split("/")[directory.split("/").length - 1]}</div>
                            <IconButton size="small" title="Change directory" onClick={toggleDrawer(true)}>
                                <VscFolderActive />
                            </IconButton>
                            <IconButton size="small" title="Collapse all" onClick={() => handleCollapseAll()}>
                                <VscCollapseAll />
                            </IconButton>
                        </Stack>
                    </Paper>
                    <div className="ExplorerContent">
                        {fileTree.map((item, index) => {
                            if (item.type === "file") {
                                return (
                                    <div className="File" key={item.name} style={{paddingLeft: 16}}>
                                        {item.name}
                                    </div>
                                );
                            }
                            return (
                                <Directory
                                    collapsed={allCollapsed}
                                    level={1}
                                    name={item.name}
                                    content={item.children}
                                    key={item.name}
                                    onDirStateChange={handleDirStateChange}
                                    indices={[index]}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </Paper>
    );
};
