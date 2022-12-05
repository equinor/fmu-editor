import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Badge, Tab, Tabs} from "@mui/material";

import React from "react";
import {VscEdit, VscSourceControl} from "react-icons/vsc";

import {Surface} from "@components/Surface";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setEditorMode} from "@redux/reducers/ui";

import {Page} from "@shared-types/ui";

import "./views.css";

export const Views: React.VFC = () => {
    const editorMode = useAppSelector(state => state.ui.page);

    const dispatch = useAppDispatch();
    const userFileChanges = useUserFileChanges();

    return (
        <Surface className="TabMenu" elevation="raised">
            <Tabs
                orientation="vertical"
                value={editorMode}
                color="inherit"
                onChange={(event: React.SyntheticEvent<Element, Event>, newValue: string) =>
                    dispatch(setEditorMode(newValue as Page))
                }
            >
                <Tab
                    icon={<VscEdit color="inherit" size={24} title="Editor" />}
                    value={Page.Editor}
                    className="MenuTab"
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
                    value={Page.DiffEditor}
                    className="MenuTab"
                />
            </Tabs>
            <div className="GlobalSettings">
                <ThemeSwitch />
            </div>
        </Surface>
    );
};
