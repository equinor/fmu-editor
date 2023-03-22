import {useUserFileChanges} from "@hooks/useUserFileChanges";
import {Badge, CircularProgress, Tab, Tabs} from "@mui/material";
import {FileChangesTopics, fileChangesWatcherService} from "@services/file-changes-service";

import React from "react";
import {VscEdit, VscSourceControl} from "react-icons/vsc";

import {AppMessageBus} from "@src/framework/app-message-bus";

import {Directory} from "@utils/file-system/directory";

import {Login} from "@components/MicrosoftGraph/Login/login";
import {Surface} from "@components/Surface";
import {ThemeSwitch} from "@components/ThemeSwitch";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {resetDiffFiles, setView} from "@redux/reducers/ui";

import {View} from "@shared-types/ui";

import "./page-tabs.css";

export const PageTabs: React.VFC = () => {
    const [initialized, setInitialized] = React.useState(fileChangesWatcherService.isInitialized());
    const view = useAppSelector(state => state.ui.view);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);
    const workingDirectory = React.useRef<Directory>(new Directory("", workingDirectoryPath));

    const userFileChanges = useUserFileChanges();

    const dispatch = useAppDispatch();

    React.useEffect(() => {
        const handleInitializedChange = (payload: {initialized: boolean}) => {
            setInitialized(payload.initialized);
        };

        const unsubscribeFunc = AppMessageBus.fileChanges.subscribe(
            FileChangesTopics.INITIALIZATION_STATE_CHANGED,
            handleInitializedChange
        );

        return unsubscribeFunc;
    }, []);

    const handlePageChange = (_, newValue: string) => {
        dispatch(setView(newValue as View));
    };

    const handlePageClick = (newView: View) => {
        if (view !== newView) {
            dispatch(resetDiffFiles());
            dispatch(setView(newView));
        }
    };

    const makeBadgeIcon = React.useCallback(() => {
        if (!workingDirectory.current.exists() || workingDirectoryPath === "") {
            return null;
        }
        if (!initialized) {
            return <CircularProgress color="inherit" size={12} />;
        }
        if (userFileChanges.length === 0) {
            return null;
        }
        return userFileChanges.length;
    }, [initialized, userFileChanges.length, workingDirectory, workingDirectoryPath]);

    return (
        <Surface className="TabMenu" elevation="raised">
            <Tabs orientation="vertical" value={view} color="inherit" onChange={handlePageChange}>
                <Tab
                    icon={<VscEdit color="inherit" size={24} title="Editor" />}
                    value={View.Editor}
                    className="MenuTab"
                    onClick={() => handlePageClick(View.Editor)}
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
                    value={View.SourceControl}
                    className="MenuTab"
                    onClick={() => handlePageClick(View.SourceControl)}
                />
                <Tab style={{visibility: "hidden"}} value={View.OngoingChanges} />
                <Tab style={{visibility: "hidden"}} value={View.Merge} />
                <Tab style={{visibility: "hidden"}} value={View.SingleFileChanges} />
            </Tabs>
            <div className="GlobalSettings">
                <Login />
                <ThemeSwitch />
            </div>
        </Surface>
    );
};
