import {useOngoingChangesForFile} from "@hooks/useOngoingChangesForFile";
import {Stack} from "@mui/material";

import React from "react";

import {Surface} from "@components/Surface";

import {useAppSelector} from "@redux/hooks";

import {OngoingChangesBrowserItem} from "./components/ongoing-changes-browser-item";
import "./ongoing-changes-browser.css";

export const OngoingChangesBrowser: React.VFC = () => {
    const diffFile = useAppSelector(state => state.ui.diffMainFile);

    const ongoingChanges = useOngoingChangesForFile(diffFile);

    return (
        <Surface elevation="raised" className="Explorer">
            <Surface elevation="raised">
                <Stack direction="row" alignItems="center" className="ExplorerTitle">
                    Changes in progress
                </Stack>
            </Surface>
            <Stack direction="column" className="ChangesBrowserContent" spacing={2}>
                <div className="ChangesBrowserContentHeader">Ongoing changes to file</div>
                <div className="ChangesBrowserText">{diffFile}</div>
                <div className="ChangesBrowserContentHeader">Changes</div>
                <div>
                    {ongoingChanges.map(change => (
                        <OngoingChangesBrowserItem key={`${change.user}-${change.relativePath}`} change={change} />
                    ))}
                </div>
            </Stack>
        </Surface>
    );
};
