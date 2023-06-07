import {AppMessageBus} from "@framework/app-message-bus";
import {useFileChanges} from "@hooks/useFileChanges";
import {Button, CircularProgress, LinearProgress} from "@mui/material";
import {FileOperationsMessages, FileOperationsTopics} from "@services/file-operations-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscFileSymlinkDirectory} from "react-icons/vsc";

import {Directory} from "@utils/file-system/directory";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setView} from "@redux/reducers/ui";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

const FILE_ORIGINS = [FileChangeOrigin.MAIN, FileChangeOrigin.BOTH];

export const UserDirectory: React.FC = () => {
    const {fileChanges, initialized} = useFileChanges(FILE_ORIGINS);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    const [progress, setProgress] = React.useState<number>(100);
    const dispatch = useAppDispatch();

    const handleUserDirectoryClick = () => {
        const workingDirectory = new Directory("", workingDirectoryPath);
        if (!workingDirectory.exists() || workingDirectoryPath === "") {
            notificationsService.publishNotification({
                type: NotificationType.INFORMATION,
                message: "Please select a working directory first.",
            });
            return;
        }
        if (!initialized || fileChanges === null) {
            notificationsService.publishNotification({
                type: NotificationType.INFORMATION,
                message: "Scanning your user directory...",
            });
            return;
        }
        if (fileChanges.length > 0) {
            dispatch(setView(View.Merge));
            return;
        }
        notificationsService.publishNotification({
            type: NotificationType.INFORMATION,
            message: "Your user directory is up to date.",
        });
    };

    React.useEffect(() => {
        const adjustProgress = (payload: FileOperationsMessages[FileOperationsTopics.COPY_USER_DIRECTORY_PROGRESS]) => {
            setProgress(Math.round(payload.progress * 100) as number);
        };

        const unsubscribeFunc = AppMessageBus.fileOperations.subscribe(
            FileOperationsTopics.COPY_USER_DIRECTORY_PROGRESS,
            adjustProgress
        );

        return unsubscribeFunc;
    }, []);

    const makeContent = React.useCallback(() => {
        const workingDirectory = new Directory("", workingDirectoryPath);
        if (!workingDirectory.exists() || workingDirectoryPath === "") {
            return (
                <>
                    <VscFileSymlinkDirectory />
                    <span>Select working directory first</span>
                </>
            );
        }
        if (!initialized) {
            return <CircularProgress size={20} color="inherit" />;
        }
        if (progress < 100) {
            return (
                <>
                    <VscFileSymlinkDirectory />
                    <span>
                        <i>Copying...</i>
                    </span>
                </>
            );
        }
        if (fileChanges === null) {
            return (
                <>
                    <VscFileSymlinkDirectory />
                    <span>Scanning...</span>
                </>
            );
        }
        if (fileChanges.length === 0) {
            return (
                <>
                    <VscFileSymlinkDirectory />
                    <span>User directory up to date</span>
                </>
            );
        }
        return (
            <span>
                {fileChanges.length} file{fileChanges.length > 1 ? "s" : ""} changed in main folder
            </span>
        );
    }, [fileChanges, initialized, progress, workingDirectoryPath]);

    const makeTitle = React.useCallback(() => {
        const workingDirectory = new Directory("", workingDirectoryPath);
        if (!workingDirectory.exists() || workingDirectoryPath === "") {
            return "Please select a working directory first.";
        }
        if (!initialized) {
            return "Scanning your user directory...";
        }
        if (progress < 100) {
            return "Copying your user directory...";
        }
        if (fileChanges === null) {
            return "Scanning your user directory...";
        }
        if (fileChanges.length === 0) {
            return "Your user directory is up to date.";
        }
        return "Main folder has been modified, click here to view changes";
    }, [fileChanges, initialized, progress, workingDirectoryPath]);

    return (
        <>
            <Button
                size="small"
                onClick={handleUserDirectoryClick}
                title={makeTitle()}
                sx={{
                    backgroundColor:
                        fileChanges === null
                            ? "var(--info)"
                            : fileChanges.length > 0
                            ? "var(--warning)"
                            : "var(--success)",
                }}
                className={fileChanges?.length === 0 ? undefined : "Error"}
            >
                {makeContent()}
            </Button>
            <div style={{width: 50, display: progress < 100 ? "block" : "none"}}>
                <LinearProgress color="inherit" variant="determinate" value={progress} />
            </div>
        </>
    );
};
