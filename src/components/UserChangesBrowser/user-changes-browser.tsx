import {useUserChangesForFile} from "@hooks/useUserChangesForFile";
import {Stack} from "@mui/material";

import React from "react";

import {Surface} from "@components/Surface";

import {useAppSelector} from "@redux/hooks";

import {UserChangesBrowserItem} from "./components/user-changes-browser-item";
import "./user-changes-browser.css";

export const UserChangesBrowser: React.VFC = () => {
    const userChangesFile = useAppSelector(state => state.ui.userChangesFile);

    const userChanges = useUserChangesForFile(userChangesFile);

    return (
        <Surface elevation="raised" className="Explorer">
            <Surface elevation="raised">
                <Stack direction="row" alignItems="center" className="ExplorerTitle">
                    User changes
                </Stack>
            </Surface>
            <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                <div className="ChangesBrowserContentHeader">Changes for file</div>
                <div className="ChangesBrowserText">{userChangesFile}</div>
                <div className="ChangesBrowserContentHeader">Changes</div>
                <div>
                    {userChanges.map(change => (
                        <UserChangesBrowserItem key={`${change.user}-${change.filePath}`} change={change} />
                    ))}
                </div>
            </Stack>
        </Surface>
    );
};
