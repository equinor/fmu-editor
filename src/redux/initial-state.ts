import {ipcRenderer} from "electron";

import electronStore from "@utils/electron-store";
import {File as FileInterface} from "@utils/file-system/file";
import {generateHashCode} from "@utils/hash";

import {EventSource, File, FilesState} from "@shared-types/files";
import {ChangesBrowserView, Themes, UiState, View} from "@shared-types/ui";
import {IpcMessages} from "@shared-types/ipc";
import {UiCoachState} from "@shared-types/ui-coach";

import {SelectionDirection} from "monaco-editor";
import path from "path";

const appData = ipcRenderer.sendSync(IpcMessages.GET_APP_DATA);
if (appData.clearElectronStore) {
    electronStore.clear();
}

const paneConfiguration = electronStore.get("ui.paneConfiguration");

const initialUiState: UiState = {
    view: View.Editor,
    settings: {
        theme: electronStore.get("ui.settings.theme") || Themes.Light,
        editorFontSize: electronStore.get("ui.settings.editorFontSize") || 1.0,
    },
    paneConfiguration: Object.keys(paneConfiguration).map(key => ({
        name: key,
        sizes: paneConfiguration[key],
    })),
    currentCommit: undefined,
    ongoingChangesRelativeFilePath: undefined,
    changesBrowserView: ChangesBrowserView.LoggedChanges,
    previewOpen: electronStore.get("ui.settings.previewOpen") || false,
    diff: {
        originalRelativeFilePath: undefined,
        modifiedRelativeFilePath: undefined,
        fileOrigin: undefined,
    },
    explorer: {
        activeItemPath: "",
        dragParentFolder: null,
        createFolder: false,
        createFile: false,
    },
};

const initialUiCoachState: UiCoachState = {
    initialConfigurationDone: electronStore.get("uiCoach.initialConfigurationDone") || false,
};

const prepareInitialFileTreeStates = () => {
    const fileTreeStates = electronStore.get("files.fileTreeStates") || {};
    const workingDirectoryPath = electronStore.get("files.workingDirectoryPath") || "";
    if (workingDirectoryPath && !fileTreeStates[workingDirectoryPath]) {
        fileTreeStates[workingDirectoryPath] = [];
    }
    return fileTreeStates;
};

const initialFilesState: FilesState = {
    fmuDirectoryPath: electronStore.get("files.fmuDirectoryPath") || "",
    workingDirectoryPath: electronStore.get("files.workingDirectoryPath") || "",
    fileTreeStates: prepareInitialFileTreeStates(),
    activeFilePath: electronStore.get("files.activeFile"),
    eventSource: EventSource.Editor,
    files:
        electronStore.get("files.files")?.map((file: any): File => {
            const workingDirectoryPath = electronStore.get("files.workingDirectoryPath") || "";
            const userFile = new FileInterface(
                path.relative(workingDirectoryPath, file.filePath),
                workingDirectoryPath
            );
            const fileContent = userFile.readString();
            return {
                filePath: file.filePath,
                associatedWithFile: userFile.exists(),
                editorValue: fileContent,
                editorViewState: file.editorViewState === "null" ? null : file.editorViewState,
                hash: fileContent ? generateHashCode(fileContent) : "",
                selection: {
                    startLineNumber: 0,
                    startColumn: 0,
                    endLineNumber: 0,
                    endColumn: 0,
                    direction: SelectionDirection.LTR,
                },
                title: "",
                permanentOpen: file.permanentOpen,
            };
        }) || [],
};

ipcRenderer.send("set-recent-files", electronStore.get("files.recentFiles") || []);

if (initialFilesState.files.length === 0) {
    initialFilesState.activeFilePath = "";
}

export default {
    ui: initialUiState,
    uiCoach: initialUiCoachState,
    files: initialFilesState,
};
