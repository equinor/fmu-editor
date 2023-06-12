import React from "react";
import {VscListSelection, VscNewFolder} from "react-icons/vsc";

import {Directory} from "@utils/file-system/directory";
import {File} from "@utils/file-system/file";
import {sanitizeFileName} from "@utils/sanitize";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {openFile} from "@redux/thunks";

import path from "path";

export enum NewItemType {
    FILE = "file",
    DIRECTORY = "directory",
}

export type NewItemProps = {
    type: NewItemType;
    onClose: () => void;
    onSubmit: (name: string) => void;
    directoryRelativePath: string;
    level: number;
};

export const NewItem: React.VFC<NewItemProps> = props => {
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    const dispatch = useAppDispatch();

    const handleSubmit = React.useCallback(
        (name: string) => {
            if (props.type === NewItemType.FILE) {
                const newFile = new File(path.join(props.directoryRelativePath, name), workingDirectoryPath);
                newFile.writeString("");
                openFile(newFile.absolutePath(), workingDirectoryPath, dispatch, true);
            } else if (props.type === NewItemType.DIRECTORY) {
                const newDirectory = new Directory(path.join(props.directoryRelativePath, name), workingDirectoryPath);
                newDirectory.makeIfNotExists();
            }
            props.onSubmit(name);
        },
        [props, dispatch, workingDirectoryPath]
    );

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleSubmit(e.currentTarget.value);
            }
        },
        [handleSubmit]
    );

    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = sanitizeFileName(e.target.value);
    }, []);

    /* eslint-disable jsx-a11y/no-autofocus */
    return (
        <>
            <div className="Overflow" onClick={() => props.onClose()} />
            <div className="ExplorerItem ExplorerItemNew" key="newFile" style={{paddingLeft: 16}}>
                {Array(props.level)
                    .fill(0)
                    .map((_, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div className="ExplorerPath" key={`${index}`} />
                    ))}
                <div className="ExplorerItemIcon">
                    {props.type === NewItemType.FILE ? <VscListSelection /> : <VscNewFolder />}
                </div>
                <input className="ExplorerItemInput" autoFocus onKeyDown={handleKeyDown} onChange={handleInputChange} />
            </div>
        </>
    );
    /* eslint-enable jsx-a11y/no-autofocus */
};
