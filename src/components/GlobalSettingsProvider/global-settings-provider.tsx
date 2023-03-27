import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {EditorType, GlobalSettings} from "@shared-types/global-settings";

const [useDataProvider, DataProvider] = createGenericContext<GlobalSettings>();

export type ExtensionsLanguageMap = {
    [key: string]: {
        language: string;
        editorType: EditorType;
    };
};

const extensionsLanguageMap = {
    ".csv": {
        language: "csv",
        editorType: EditorType.CsvXlsx,
    },
    ".ert": {language: "ert", editorType: EditorType.Monaco},
    ".py": {language: "python", editorType: EditorType.Monaco},
    ".json": {language: "json", editorType: EditorType.Monaco},
    ".sh": {language: "shell", editorType: EditorType.Monaco},
    ".txt": {language: "text", editorType: EditorType.Monaco},
    ".xml": {language: "xml", editorType: EditorType.Monaco},
    ".yaml": {language: "yaml", editorType: EditorType.Monaco},
    ".yml": {language: "yaml", editorType: EditorType.Monaco},
};

export const GlobalSettingsProvider: React.FC = ({children}) => {
    const globalSettings: GlobalSettings = {
        supportedFileExtensions: [".csv", ".ert", ".json", ".sh", ".py", ".txt", ".xml", ".yaml", ".yml"],
        languageForFileExtension: (extension: string) => {
            return extensionsLanguageMap[extension].language || "text";
        },
        editorTypeForFileExtension: (extension: string) => {
            return extensionsLanguageMap[extension].editorType || EditorType.Monaco;
        },
    };

    return <DataProvider value={globalSettings}>{children}</DataProvider>;
};

export const useGlobalSettings = (): GlobalSettings => useDataProvider();
