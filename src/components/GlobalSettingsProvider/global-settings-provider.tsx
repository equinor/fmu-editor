import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {GlobalSettings} from "@shared-types/global-settings";

const [useDataProvider, DataProvider] = createGenericContext<GlobalSettings>();

export const GlobalSettingsProvider: React.FC = ({children}) => {
    const globalSettings: GlobalSettings = {
        supportedFileExtensions: [".yaml", ".yml", ".py", ".json"],
    };

    return <DataProvider value={globalSettings}>{children}</DataProvider>;
};

export const useGlobalSettings = (): GlobalSettings => useDataProvider();
