import {Paper, Tab, Tabs, Tooltip} from "@mui/material";

import React from "react";
import {VscDiff, VscEdit} from "react-icons/vsc";

import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setCurrentPage} from "@redux/reducers/ui";

import {Pages} from "@shared-types/ui";

import "./views.css";

export const Views: React.VFC = () => {
    const currentPage = useAppSelector(state => state.ui.currentPage);

    const dispatch = useAppDispatch();

    return (
        <Paper elevation={6} className="TabMenu" sx={{borderRadius: 0}}>
            <Tabs
                orientation="vertical"
                value={currentPage}
                color="inherit"
                onChange={(event: React.SyntheticEvent<Element, Event>, newValue: string) =>
                    dispatch(setCurrentPage(newValue as Pages))
                }
            >
                <Tab
                    icon={
                        <Tooltip title="Editor" placement="right" arrow>
                            <VscEdit color="inherit" size={24} />
                        </Tooltip>
                    }
                    value={Pages.Editor}
                    className="MenuTab"
                />
                <Tab
                    icon={
                        <Tooltip title="Diff-Editor" placement="right" arrow>
                            <VscDiff color="inherit" size={24} />
                        </Tooltip>
                    }
                    value={Pages.DiffEditor}
                    className="MenuTab"
                />
            </Tabs>
            <div className="GlobalSettings">
                <ThemeSwitch />
            </div>
        </Paper>
    );
};
