import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {GlobalSettings} from "@shared-types/global-settings";

const [useDataProvider, DataProvider] = createGenericContext<GlobalSettings>();

export const GlobalSettingsProvider: React.FC = ({children}) => {
    const globalSettings: GlobalSettings = {
        supportedFileExtensions: [
            ".csv",
            ".ert",
            ".json",
            ".sh",
            ".py",
            ".txt",
            ".xml",
            ".yaml",
            ".yml"
        ],
        languageForFileExtension: (extension: string) => {
            const fileExtensionLanguageMap: Record<string, string> = {
                ".csv": "csv",
                ".ert": "ert",
                ".py": "python",
                ".json": "json",
                ".sh": "shell",
                ".txt": "text",
                ".xml": "xml",
                ".yaml": "yaml",
                ".yml": "yaml",
            };
            return fileExtensionLanguageMap[extension] || "text";
        },
    };

    return <DataProvider value={globalSettings}>{children}</DataProvider>;
};

export const useGlobalSettings = (): GlobalSettings => useDataProvider();
