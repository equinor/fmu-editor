import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Badge, Tab, Tabs} from "@mui/material";

import React from "react";
import {VscEdit, VscSourceControl} from "react-icons/vsc";

import {Login} from "@components/MicrosoftGraph/Login/login";
import {Surface} from "@components/Surface";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setPage, setView} from "@redux/reducers/ui";

import {Page, View} from "@shared-types/ui";

import "./page-tabs.css";

export const PageTabs: React.VFC = () => {
    const page = useAppSelector(state => state.ui.page);

    const dispatch = useAppDispatch();
    const userFileChanges = useUserFileChanges();

    const handlePageChange = (_, newValue: string) => {
        dispatch(setPage(newValue as Page));
        dispatch(setView(View.Main));
    };

    const handlePageClick = () => {
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
                            badgeContent={userFileChanges.length}
                            color="primary"
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
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
