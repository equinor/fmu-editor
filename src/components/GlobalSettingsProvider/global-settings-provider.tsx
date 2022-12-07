import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {GlobalSettings} from "@shared-types/global-settings";

const [useDataProvider, DataProvider] = createGenericContext<GlobalSettings>();

export const GlobalSettingsProvider: React.FC = ({children}) => {
    const globalSettings: GlobalSettings = {
        supportedFileExtensions: [".yaml", ".yml", ".py", ".json", ".txt", ".xml"],
        languageForFileExtension: (extension: string) => {
            const fileExtensionLanguageMap: Record<string, string> = {
                ".yaml": "yaml",
                ".yml": "yaml",
                ".py": "python",
                ".json": "json",
                ".txt": "text",
                ".xml": "xml",
            };
            return fileExtensionLanguageMap[extension] || "text";
        },
    };

    return <DataProvider value={globalSettings}>{children}</DataProvider>;
};

export const useGlobalSettings = (): GlobalSettings => useDataProvider();
