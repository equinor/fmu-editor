import {ipcRenderer} from "electron";

import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {MainProcessData} from "@shared-types/main-process-data";

const [useDataProvider, DataProvider] = createGenericContext<MainProcessData>();

export const MainProcessDataProvider: React.FC = ({children}) => {
    const [data, setData] = React.useState<MainProcessData>({
        version: "unknown",
        userDataDir: "",
        userHomeDir: "",
        appDir: "",
        isDev: false,
    });

    React.useEffect(() => {
        setData(ipcRenderer.sendSync("get-app-data"));
    }, []);

    return <DataProvider value={data}>{children}</DataProvider>;
};

export const useMainProcessDataProvider = (): MainProcessData =>
    useDataProvider();
