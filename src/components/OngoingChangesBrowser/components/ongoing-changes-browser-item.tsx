import {IDynamicPerson} from "@microsoft/mgt-components";

import React from "react";

import {File} from "@utils/file-system/file";

import {Avatar} from "@components/MicrosoftGraph/Avatar";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDiffUserFile} from "@redux/reducers/ui";

import {FileChange, FileChangeOrigin} from "@shared-types/file-changes";

export type UserChangesBrowserItemProps = {
    change: FileChange;
};

export const OngoingChangesBrowserItem: React.FC<UserChangesBrowserItemProps> = props => {
    const [userDetails, setUserDetails] = React.useState<IDynamicPerson | null>(null);
    const directory = useAppSelector(state => state.files.directory);
    const diffUserFile = useAppSelector(state => state.ui.diffUserFile);
    const [userFile, setUserFile] = React.useState<File | null>(null);

    const dispatch = useAppDispatch();

    const handleClick = (filePath: string, user: string) => {
        const file = new File(filePath, directory);
        dispatch(
            setDiffUserFile({
                userFile: file.getUserVersion(user).relativePath(),
                origin: FileChangeOrigin.USER,
            })
        );
    };

    React.useEffect(() => {
        setUserFile(new File(props.change.relativePath, directory).getUserVersion(props.change.user));
    }, [props.change.relativePath, props.change.user, directory]);

    return (
        <a
            className={`OngoingChangesBrowserItem${
                userFile.absolutePath() === diffUserFile ? " OngoingChangesBrowserItem--selected" : ""
            }`}
            onClick={() => handleClick(props.change.relativePath, props.change.user)}
        >
            <Avatar user={props.change.user} size={40} getDetails={(_, details) => setUserDetails(details)} />
            <div>
                <div className="TextOverflow" title={userDetails?.displayName || props.change.user}>
                    {userDetails?.displayName || props.change.user}
                </div>
                {props.change.modified && (
                    <div className="ChangesBrowserDate">
                        authored {new Date(props.change.modified).toLocaleDateString()}
                        {" @ "}
                        {new Date(props.change.modified).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </a>
    );
};
