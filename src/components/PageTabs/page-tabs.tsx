import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Badge, CircularProgress, Tab, Tabs} from "@mui/material";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";
import {VscEdit, VscSourceControl} from "react-icons/vsc";

import {Login} from "@components/MicrosoftGraph/Login/login";
import {Surface} from "@components/Surface";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setPage, setView} from "@redux/reducers/ui";

import {Page, View} from "@shared-types/ui";

import "./page-tabs.css";

export const PageTabs: React.VFC = () => {
    const page = useAppSelector(state => state.ui.page);
    const view = useAppSelector(state => state.ui.view);

    const dispatch = useAppDispatch();
    const userFileChanges = useUserFileChanges();
    const {initialized} = useFileChangesWatcher();

    const handlePageChange = (_, newValue: string) => {
        dispatch(setPage(newValue as Page));
        dispatch(setView(View.Main));
    };

    const handlePageClick = () => {
        if (view !== View.Main) {
            dispatch(resetDiffFiles());
        }
        dispatch(setView(View.Main));
    };

    return (
        <Surface className="TabMenu" elevation="raised">
            <Tabs orientation="vertical" value={page} color="inherit" onChange={handlePageChange}>
                <Tab
                    icon={<VscEdit color="inherit" size={24} title="Editor" />}
                    value={Page.Editor}
                    className="MenuTab"
                    onClick={() => handlePageClick()}
                />
                <Tab
                    icon={
                        <Badge
                            badgeContent={
                                initialized ? userFileChanges.length : <CircularProgress color="inherit" size={12} />
                            }
                            color="primary"
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            sx={{backgroundColor: initialized ? undefined : "transparent"}}
                        >
                            <VscSourceControl color="inherit" size={24} title="Source control" />
                        </Badge>
                    }
                    value={Page.SourceControl}
                    className="MenuTab"
                    onClick={() => handlePageClick()}
                />
            </Tabs>
            <div className="GlobalSettings">
                <Login />
                <ThemeSwitch />
            </div>
        </Surface>
    );
};
