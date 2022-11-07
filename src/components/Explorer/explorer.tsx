import {ipcRenderer} from "electron";

import React from "react";
import {VscCollapseAll} from "react-icons/vsc";

import {readFileTree} from "@utils/file-operations";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDirectory} from "@redux/reducers/files";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {FileTree} from "@shared-types/file-tree";

import {Directory} from "./components/directory";
import "./explorer.css";

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
            defaultPath: directory,
        };
        ipcRenderer.invoke("select-file", opts).then(result => {
            if (result) {
                dispatch(setDirectory({path: result[0]}));
            }
        });
    };

    return (
        <div className="Explorer">
            <div className="ExplorerTitle" onClick={() => handleOpenDirectoryClick()}>
                {directory.split("/")[directory.split("/").length - 1]} <VscCollapseAll />
            </div>
            {fileTree.map(item => {
                if (item.type === "file") {
                    return (
                        <div className="File" key={item.name} style={{paddingLeft: 16}}>
                            {item.name}
                        </div>
                    );
                }
                return <Directory level={1} name={item.name} content={item.children} key={item.name} />;
            })}
        </div>
    );
};
