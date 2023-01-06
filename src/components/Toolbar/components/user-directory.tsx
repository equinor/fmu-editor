import {useFileChanges} from "@hooks/useFileChanges";
import {Button, CircularProgress, LinearProgress} from "@mui/material";
import {useFileChangesWatcher} from "@services/file-changes-service";

import React from "react";
import {VscFileSymlinkDirectory} from "react-icons/vsc";

import {useAppDispatch} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";
import {setView} from "@redux/reducers/ui";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

const FILE_ORIGINS = [FileChangeOrigin.MAIN, FileChangeOrigin.BOTH];

export const UserDirectory: React.FC = () => {
    const fileChanges = useFileChanges(FILE_ORIGINS);
    const {initialized} = useFileChangesWatcher();

    const [progress, setProgress] = React.useState<number>(100);
    const dispatch = useAppDispatch();

    const handleUserDirectoryClick = () => {
        if (!initialized || fileChanges === null) {
            addNotification({type: NotificationType.INFORMATION, message: "Scanning your user directory..."});
            return;
        }
        if (fileChanges.length > 0) {
            dispatch(setView(View.Merge));
            return;
        }
        dispatch(addNotification({type: NotificationType.INFORMATION, message: "Your user directory is up to date."}));
    };

    React.useEffect(() => {
        const adjustProgress = (e: Event) => {
            // @ts-ignore
            setProgress(Math.round(e.detail.progress * 100) as number);
        };

        document.addEventListener("copyUserDirectoryProgress", adjustProgress);

        return () => {
            document.removeEventListener("copyUserDirectoryProgress", adjustProgress);
        };
    }, []);

    return (
        <>
            <Button
                size="small"
                onClick={handleUserDirectoryClick}
                title={
                    fileChanges === null
                        ? "Scanning your user directory..."
                        : fileChanges.length > 0
                        ? "Main folder has been modified, click here to view changes"
                        : "Your user directory is up to date"
                }
                sx={{
                    backgroundColor:
                        fileChanges === null
                            ? "var(--info)"
                            : fileChanges.length > 0
                            ? "var(--warning)"
                            : "var(--success)",
                }}
                className={fileChanges?.length === 0 ? undefined : "error"}
            >
                {initialized ? (
                    <>
                        <VscFileSymlinkDirectory />
                        {progress < 100 ? (
                            <span>
                                <i>Copying...</i>
                            </span>
                        ) : fileChanges === null ? (
                            <span>Scanning...</span>
                        ) : fileChanges.length === 0 ? (
                            <span>User directory up to date</span>
                        ) : (
                            <span>
                                {fileChanges.length} file{fileChanges.length > 1 ? "s" : ""} changed in main folder
                            </span>
                        )}
                    </>
                ) : (
                    <CircularProgress size={16} color="inherit" />
                )}
            </Button>
            <div style={{width: 50, display: progress < 100 ? "block" : "none"}}>
                <LinearProgress color="inherit" variant="determinate" value={progress} />
            </div>
        </>
    );
};
