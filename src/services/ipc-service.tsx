import {ipcRenderer} from "electron";

import React from "react";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";
import {setInitialConfigurationDone} from "@redux/reducers/uiCoach";
import {saveFile} from "@redux/thunks";

import {NotificationType} from "@shared-types/notifications";

export const IpcService: React.FC = props => {
    const dispatch = useAppDispatch();
    const activeFilePath = useAppSelector(state => state.files.activeFile);
    const associatedWithFile = useAppSelector(
        state => state.files.files.find(el => el.filePath === state.files.activeFile)?.associatedWithFile || false
    );
    const currentEditorValue = useAppSelector(
        state => state.files.files.find(el => el.filePath === state.files.activeFile)?.editorValue || ""
    );
    const mainProcessData = useMainProcessDataProvider();
    const workingDirectory = useAppSelector(state => state.files.directory);

    React.useEffect(() => {
        const listeners: string[] = [];
        const addListener = (channelName: string, func: (event?: Electron.IpcRendererEvent, args?: any) => void) => {
            listeners.push(channelName);
            ipcRenderer.on(channelName, func);
        };

        addListener("save-file", () => {
            saveFile(activeFilePath, currentEditorValue, workingDirectory, dispatch);
        });

        addListener("error", (_, errorMessage) => {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: errorMessage,
                })
            );
        });

        addListener("debug:reset", () => {
            dispatch(setInitialConfigurationDone(false));
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Initial configuration state reset.",
                })
            );
        });

        return () => {
            listeners.forEach(channelName => {
                ipcRenderer.removeAllListeners(channelName);
            });
        };
    }, [activeFilePath, currentEditorValue, dispatch, mainProcessData, associatedWithFile, workingDirectory]);

    return <>{props.children}</>;
};
