import {ipcRenderer} from "electron";

import electronStore from "@utils/electron-store";
import {getFileContent} from "@utils/file-operations";
import {generateHashCode} from "@utils/hash";

import {EventSource, File, FilesState} from "@shared-types/files";
import {NotificationsState} from "@shared-types/notifications";
import {PreferencesState} from "@shared-types/preferences";
import {Page, Themes, UiState} from "@shared-types/ui";
import {UiCoachState} from "@shared-types/ui-coach";

import fs from "fs";
import {SelectionDirection} from "monaco-editor";

const paneConfiguration = electronStore.get("ui.paneConfiguration");

const initialUiState: UiState = {
    page: Page.Editor,
    settings: {
        theme: electronStore.get("ui.settings.theme") || Themes.Light,
        editorFontSize: electronStore.get("ui.settings.editorFontSize") || 1.0,
    },
    paneConfiguration: Object.keys(paneConfiguration).map(key => ({
        name: key,
        sizes: paneConfiguration[key],
    })),
};

const initialPreferencesState: PreferencesState = {
    pathToPythonInterpreter: electronStore.get("preferences.pathToPythonInterpreter") || "",
    pathToYamlSchemaFile: electronStore.get("preferences.pathToYamlSchemaFile") || "",
    webvizTheme: electronStore.get("preferences.webvizTheme") || "",
};

const initialUiCoachState: UiCoachState = {
    initialConfigurationDone: electronStore.get("uiCoach.initialConfigurationDone") || false,
};

const initialFilesState: FilesState = {
    fmuDirectory: electronStore.get("files.fmuDirectory") || "",
    directory: electronStore.get("files.directory") || "",
    fileTreeStates: electronStore.get("ui.fileTreeStates") || {},
    activeFile: electronStore.get("files.activeFile"),
    activeDiffFile: electronStore.get("files.activeDiffFile"),
    eventSource: EventSource.Editor,
    files:
        electronStore.get("files.files")?.map((file: any): File => {
            const fileContent = getFileContent(file.filePath);
            return {
                filePath: file.filePath,
                userFilePath: file.userFilePath,
                associatedWithFile: fs.existsSync(file.filePath),
                editorValue: fileContent,
                editorViewState: file.editorViewState,
                hash: generateHashCode(fileContent),
                selection: {
                    startLineNumber: 0,
                    startColumn: 0,
                    endLineNumber: 0,
                    endColumn: 0,
                    direction: SelectionDirection.LTR,
                },
                title: "",
            };
        }) || [],
};

ipcRenderer.send("set-recent-files", electronStore.get("files.recentFiles") || []);

if (initialFilesState.files.length === 0) {
    initialFilesState.activeFile = "";
}

const notificationsState: NotificationsState = {
    notifications: [],
};

export default {
    ui: initialUiState,
    uiCoach: initialUiCoachState,
    preferences: initialPreferencesState,
    files: initialFilesState,
    notifications: notificationsState,
};
