import {ipcRenderer} from "electron";

import React from "react";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";
import {setInitialConfigurationDone} from "@redux/reducers/uiCoach";
import {saveFile} from "@redux/thunks";
import {SaveFileResult} from "@redux/thunks/save-file";

import {NotificationType} from "@shared-types/notifications";

import {useFileManager} from "./file-manager";

export const IpcService: React.FC = props => {
    const dispatch = useAppDispatch();
    const {fileManager, copyUserDirectory} = useFileManager();
    const activeFilePath = useAppSelector(state => state.files.activeFile);
    const associatedWithFile = useAppSelector(
        state => state.files.files.find(el => el.filePath === state.files.activeFile)?.associatedWithFile || false
    );
    const currentEditorValue = useAppSelector(
        state => state.files.files.find(el => el.filePath === state.files.activeFile)?.editorValue || ""
    );
    const mainProcessData = useMainProcessDataProvider();

    React.useEffect(() => {
        const listeners: string[] = [];
        const addListener = (channelName: string, func: (event?: Electron.IpcRendererEvent, args?: any) => void) => {
            listeners.push(channelName);
            ipcRenderer.on(channelName, func);
        };
        addListener("save-file", () => {
            const result = saveFile(activeFilePath, currentEditorValue, fileManager, dispatch);
            if (result === SaveFileResult.NO_USER_DIRECTORY) {
                dispatch(
                    addNotification({
                        type: NotificationType.ERROR,
                        message: `You don't have a copy of the working directory (${fileManager.getCurrentDirectory()}). Create it now? Note: this might take a couple of minutes.`,
                        action: {
                            label: "Create",
                            action: () => {
                                copyUserDirectory();
                            },
                        },
                    })
                );
            }
            // document.dispatchEvent(new Event("save-file"));
        });

        addListener("error", (_, errorMessage) => {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: errorMessage,
                })
            );
        });

        addListener("debug:reset-init", () => {
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
    }, [
        activeFilePath,
        currentEditorValue,
        dispatch,
        mainProcessData,
        associatedWithFile,
        fileManager,
        copyUserDirectory,
    ]);

    return <>{props.children}</>;
};
