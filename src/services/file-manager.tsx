import React from "react";

import {FileManager} from "@utils/file-manager";
import {createGenericContext} from "@utils/generic-context";

import {useAppSelector} from "@redux/hooks";

import {useEnvironment} from "./environment-service";

export type Context = {
    fileManager: FileManager;
};

const [useFileManagerContext, FileManagerContextProvider] = createGenericContext<Context>();

export const FileManagerService: React.FC = props => {
    const environment = useEnvironment();
    const fmuDirectory = useAppSelector(state => state.files.fmuDirectory);
    const currentDirectory = useAppSelector(state => state.files.directory);

    const fileManager = React.useRef<FileManager>(new FileManager());

    React.useEffect(() => {
        if (fileManager.current) {
            fileManager.current.setFmuDirectory(fmuDirectory);
            fileManager.current.setUsername(environment.username);
            fileManager.current.setCurrentDirectory(currentDirectory);
        }
    }, [environment.username, fmuDirectory, currentDirectory]);

    return (
        <FileManagerContextProvider
            value={{
                fileManager: fileManager.current,
            }}
        >
            {props.children}
        </FileManagerContextProvider>
    );
};

export const useFileManager = (): Context => useFileManagerContext();
