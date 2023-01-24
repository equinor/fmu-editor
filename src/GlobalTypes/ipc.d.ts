declare global {
    interface Window {
        electron: {
            getAppData: () => void;
            disableSaveActions: () => void;
            enableSaveActions: () => void;
            saveFileAs: () => void;
            selectFile: () => void;
            handleNewFile: (func: () => void) => void;
            handleSaveFile: (func: () => void) => void;
            handleError: (func: (error: string) => void) => void;
            handleDebugReset: (func: () => void) => void;
        };
    }
}

export default global;
