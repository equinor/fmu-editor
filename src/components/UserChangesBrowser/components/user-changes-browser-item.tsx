import {IDynamicPerson} from "@microsoft/mgt-components";
import {useFileManager} from "@services/file-manager";

import React from "react";

import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveDiffFile} from "@redux/reducers/files";

import {FileChange} from "@shared-types/file-changes";

import path from "path";

export type UserChangesBrowserItemProps = {
    change: FileChange;
};

export const UserChangesBrowserItem: React.FC<UserChangesBrowserItemProps> = props => {
    const [userDetails, setUserDetails] = React.useState<IDynamicPerson | null>(null);
    const {fileManager} = useFileManager();
    const directory = useAppSelector(state => state.files.directory);
    const activeDiffFile = useAppSelector(state => state.files.activeDiffFile);

    const dispatch = useAppDispatch();

    const handleClick = (filePath: string, user: string) => {
        dispatch(
            setActiveDiffFile({relativeFilePath: fileManager.getUserFileIfExists(path.join(directory, filePath), user)})
        );
    };

    return (
        <a
            className={`UserChangesBrowserItem${
                fileManager.getUserFileIfExists(path.join(directory, props.change.filePath), props.change.user) ===
                activeDiffFile
                    ? " UserChangesBrowserItem--selected"
                    : ""
            }`}
            onClick={() => handleClick(props.change.filePath, props.change.user)}
        >
            <Avatar user={props.change.user} size={40} getDetails={(_, details) => setUserDetails(details)} />
            <div>
                <div className="TextOverflow" title={userDetails?.displayName || props.change.user}>
                    {userDetails?.displayName || props.change.user}
                </div>
                <div className="ChangesBrowserDate">
                    authored {new Date(props.change.modified).toLocaleDateString()}
                    {" @ "}
                    {new Date(props.change.modified).toLocaleTimeString()}
                </div>
            </div>
        </a>
    );
};
