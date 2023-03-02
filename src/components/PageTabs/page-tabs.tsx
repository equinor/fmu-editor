import {Badge, CircularProgress, Tab, Tabs} from "@mui/material";
import {FileChangesTopics} from "@services/file-changes-service";

import React from "react";
import {VscEdit, VscSourceControl} from "react-icons/vsc";

import {AppMessageBus} from "@src/framework/app-message-bus";

import {Directory} from "@utils/file-system/directory";

import {Login} from "@components/MicrosoftGraph/Login/login";
import {Surface} from "@components/Surface";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setPage, setView} from "@redux/reducers/ui";

import {FileChange} from "@shared-types/file-changes";
import {Page, View} from "@shared-types/ui";

import "./page-tabs.css";

export const PageTabs: React.VFC = () => {
    const [userFileChanges, setUserFileChanges] = React.useState<FileChange[]>([]);
    const [initialized, setInitialized] = React.useState(false);
    const page = useAppSelector(state => state.ui.page);
    const view = useAppSelector(state => state.ui.view);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const workingDirectory = new Directory("", workingDirectoryPath);

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        const handleUserFileChangesChange = (fileChanges: FileChange[]) => {
            setUserFileChanges(fileChanges);
            setInitialized(true);
        };

        const unsubscribeFunc = AppMessageBus.fileChanges.subscribe(
            FileChangesTopics.FILES_CHANGED,
            handleUserFileChangesChange
        );

        return unsubscribeFunc;
    }, []);

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

    const makeBadgeIcon = React.useCallback(() => {
        if (!workingDirectory.exists() || workingDirectoryPath === "") {
            return null;
        }
        if (!initialized) {
            return <CircularProgress color="inherit" size={12} />;
        }
        if (userFileChanges.length === 0) {
            return null;
        }
        return userFileChanges.length;
    }, [initialized, userFileChanges.length]);

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
                            badgeContent={makeBadgeIcon()}
                            color="primary"
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "right",
                            }}
                            sx={{
                                backgroundColor: initialized ? undefined : "transparent",
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
