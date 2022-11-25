import {Tab, Tabs} from "@mui/material";

import React from "react";
import {VscDiff, VscEdit} from "react-icons/vsc";

import {Surface} from "@components/Surface";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setEditorMode} from "@redux/reducers/ui";

import {EditorMode} from "@shared-types/ui";

import "./views.css";

export const Views: React.VFC = () => {
    const editorMode = useAppSelector(state => state.ui.editorMode);

    const dispatch = useAppDispatch();

    return (
        <Surface className="TabMenu" elevation={5}>
            <Tabs
                orientation="vertical"
                value={editorMode}
                color="inherit"
                onChange={(event: React.SyntheticEvent<Element, Event>, newValue: string) =>
                    dispatch(setEditorMode(newValue as EditorMode))
                }
            >
                <Tab
                    icon={<VscEdit color="inherit" size={24} title="Editor" />}
                    value={EditorMode.Editor}
                    className="MenuTab"
                />
                <Tab
                    icon={<VscDiff color="inherit" size={24} title="Diff Editor" />}
                    value={EditorMode.DiffEditor}
                    className="MenuTab"
                />
            </Tabs>
            <div className="GlobalSettings">
                <ThemeSwitch />
            </div>
        </Surface>
    );
};
