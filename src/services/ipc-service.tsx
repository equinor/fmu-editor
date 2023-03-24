import {ipcRenderer} from "electron";

import React from "react";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {saveFile} from "@redux/thunks";

import {NotificationType} from "@shared-types/notifications";

import {notificationsService} from "./notifications-service";

import electronStore from "../utils/electron-store";
import {getEditorValue} from "../utils/monaco";

export const IpcService: React.FC = props => {
    const dispatch = useAppDispatch();
    const activeFilePath = useAppSelector(state => state.files.activeFilePath);
    const associatedWithFile = useAppSelector(
        state => state.files.files.find(el => el.filePath === state.files.activeFilePath)?.associatedWithFile || false
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
            saveFile(activeFilePath, getEditorValue(activeFilePath) || "", workingDirectoryPath, dispatch);
        });

        addListener("error", (_, errorMessage) => {
            notificationsService.publishNotification({
                type: NotificationType.ERROR,
                message: errorMessage,
            });
        });

        addListener("debug:reset-electron-store", () => {
            electronStore.clear();
            notificationsService.publishNotification({
                type: NotificationType.SUCCESS,
                message: "Electron store successfully reset.",
            });
            window.location.reload();
        });

        addListener("push-notification", (_, notification) => {
            notificationsService.publishNotification(notification);
        });

        return () => {
            listeners.forEach(channelName => {
                ipcRenderer.removeAllListeners(channelName);
            });
        };
    }, [activeFilePath, dispatch, mainProcessData, associatedWithFile, workingDirectoryPath]);

    return <>{props.children}</>;
};
