import {useOngoingChangesForFile} from "@hooks/useOngoingChangesForFile";
import {IconButton, Stack} from "@mui/material";

import React from "react";
import {VscClose} from "react-icons/vsc";

import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setView} from "@redux/reducers/ui";

import {View} from "@shared-types/ui";

import {OngoingChangesBrowserItem} from "./components/ongoing-changes-browser-item";
import "./ongoing-changes-browser.css";

export const OngoingChangesBrowser: React.VFC = () => {
    const diffFile = useAppSelector(state => state.ui.diff.originalRelativeFilePath);
    const ongoingChanges = useOngoingChangesForFile(diffFile);
    const dispatch = useAppDispatch();

    const handleClose = React.useCallback(() => {
        dispatch(resetDiffFiles());
        dispatch(setView(View.Editor));
    }, [dispatch]);

    return (
        <Surface elevation="raised" className="Explorer">
            <Surface elevation="raised">
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="ExplorerTitle">
                    Changes in progress
                    <IconButton onClick={handleClose}>
                        <VscClose />
                    </IconButton>
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
