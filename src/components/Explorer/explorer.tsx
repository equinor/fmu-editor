import {FileTreeWithState} from "../../shared-types/file-tree";
import {Button, IconButton, Paper, Stack, Typography} from "@mui/material";

import {ipcRenderer} from "electron";

import React from "react";
import {VscCollapseAll} from "react-icons/vsc";

import {readFileTree} from "@utils/file-operations";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDirectory} from "@redux/reducers/files";
import {setFileTreeState} from "@redux/reducers/ui";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {FileTree} from "@shared-types/file-tree";

import {Directory} from "./components/directory";
import "./explorer.css";

export const Explorer: React.FC = () => {
    const directory = useAppSelector(state => state.files.directory);
    const fileTreeState = useAppSelector(state => state.ui.fileTreeState);
    const [fileTree, setFileTree] = React.useState<FileTree>([]);
    const [allCollapsed, setAllCollapsed] = React.useState<number>(0);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (directory !== undefined && directory !== "") {
            setFileTree(readFileTree(directory));
        }
    }, [directory]);

    const handleOpenDirectoryClick = () => {
        const opts: FileExplorerOptions = {
            isDirectoryExplorer: true,
            title: "Open FMU Directory",
            defaultPath: directory,
        };
        ipcRenderer.invoke("select-file", opts).then(result => {
            if (result) {
                dispatch(setDirectory({path: result[0]}));
            }
        });
    };

    const handleCollapseAll = () => {
        setAllCollapsed(prev => prev + 1);
    };

    const mapFileTree = (fileTreeElement: FileTree): FileTreeWithState => {
        return fileTreeElement.map(el => ({
            name: el.name,
            type: el.type,
            state: "collapsed",
            children: el.children ? mapFileTree(el.children) : undefined,
        }));
    };

    const handleDirStateChange = (indices: number[], isExpanded: boolean) => {
        let newFileTreeState = fileTreeState;
        if (newFileTreeState.length === 0) {
            newFileTreeState = mapFileTree(fileTree);
        }
        let current = newFileTreeState;
        indices.forEach((index, i) => {
            if (i < indices.length - 1 && current[index].children !== undefined) {
                current = current[index].children;
            } else {
                current[index].state = isExpanded ? "expanded" : "collapsed";
            }
        });
        dispatch(setFileTreeState(newFileTreeState));
    };

    return (
        <Paper className="Explorer" elevation={3}>
            {directory === undefined || directory === "" ? (
                <Stack className="ExplorerNoDirectory" spacing={2}>
                    <Button variant="contained" onClick={handleOpenDirectoryClick}>
                        Select FMU Directory
                    </Button>
                    <Typography>In order to start using the editor, please select your FMU directory.</Typography>
                </Stack>
            ) : (
                <>
                    <Stack direction="row" justifyContent="stretch" className="ExplorerTitle">
                        {directory.split("/")[directory.split("/").length - 1]}{" "}
                        <IconButton onClick={() => handleCollapseAll()}>
                            <VscCollapseAll />
                        </IconButton>
                    </Stack>
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
                </>
            )}
        </Paper>
    );
};
