import {ipcRenderer} from "electron";

import React from "react";

import {readFileTree} from "@utils/file-operations";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDirectory} from "@redux/reducers/files";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {FileTree} from "@shared-types/file-tree";

export const Explorer: React.FC = () => {
    const directory = useAppSelector(state => state.files.directory);
    const [fileTree, setFileTree] = React.useState<FileTree>([]);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        if (directory !== undefined && directory !== "") {
            console.log(directory);
            setFileTree(readFileTree(directory));
        }
    }, [directory]);

    const handleOpenDirectoryClick = () => {
        const opts: FileExplorerOptions = {
            isDirectoryExplorer: true,
            title: "Open FMU Directory",
        };
        ipcRenderer.invoke("select-file", opts).then(result => {
            if (result) {
                dispatch(setDirectory({path: result[0]}));
            }
        });
    };

    return (
        <div className="Explorer" onClick={() => handleOpenDirectoryClick()}>
            {JSON.stringify(fileTree)}
        </div>
    );
};
