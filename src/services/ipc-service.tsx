import {ipcRenderer} from "electron";

import React from "react";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setInitialConfigurationDone} from "@redux/reducers/uiCoach";
import {saveFile} from "@redux/thunks";

import {NotificationType} from "@shared-types/notifications";

import {notificationsService} from "./notifications-service";

export const IpcService: React.FC = props => {
    const dispatch = useAppDispatch();
    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const associatedWithFile = useAppSelector(
        state => state.files.files.find(el => el.filePath === state.files.activeFilePath)?.associatedWithFile || false
    );
    const currentEditorValue = useAppSelector(
        state => state.files.files.find(el => el.filePath === state.files.activeFilePath)?.editorValue || ""
    );
    const mainProcessData = useMainProcessDataProvider();
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    React.useEffect(() => {
        const listeners: string[] = [];
        const addListener = (channelName: string, func: (event?: Electron.IpcRendererEvent, args?: any) => void) => {
            listeners.push(channelName);
            ipcRenderer.on(channelName, func);
        };

        addListener("save-file", () => {
            saveFile(activeFilePath, currentEditorValue, workingDirectoryPath, dispatch);
        });

        addListener("error", (_, errorMessage) => {
            notificationsService.publishNotification({
                type: NotificationType.ERROR,
                message: errorMessage,
            });
        });

        addListener("debug:reset", () => {
            dispatch(setInitialConfigurationDone(false));
            notificationsService.publishNotification({
                type: NotificationType.SUCCESS,
                message: "Initial configuration state reset.",
            });
        });

        addListener("push-notification", (_, notification) => {
            notificationsService.publishNotification(notification);
        });

        return () => {
            listeners.forEach(channelName => {
                ipcRenderer.removeAllListeners(channelName);
            });
        };
    }, [activeFilePath, currentEditorValue, dispatch, mainProcessData, associatedWithFile, workingDirectoryPath]);

    return <>{props.children}</>;
};
