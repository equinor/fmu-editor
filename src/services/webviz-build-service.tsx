import {ipcRenderer} from "electron";

import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {NotificationType} from "@shared-types/notifications";
import {Pages} from "@shared-types/ui";

import fs from "fs";
import path from "path";
import {Options, PythonShell, PythonShellError} from "python-shell";
import {v4} from "uuid";

export enum WebvizBuildState {
    Loading = "loading",
    Loaded = "loaded",
    PythonError = "python-error",
    UnsavedFile = "unsaved-file",
    FileError = "file-error",
}

type Context = {
    port: string;
    token: string;
    consoleMessages: string[];
    builderState: WebvizBuildState;
};

const createTempFilePath = (dir: string): string => {
    let tempPath = "";
    while (tempPath === "" || fs.existsSync(tempPath)) {
        tempPath = path.resolve(dir, `.~${v4()}.yaml`);
    }
    ipcRenderer.send("add-temp-file", tempPath);
    return tempPath;
};

const [useWebvizBuildServiceContext, WebvizBuildServiceContextProvider] =
    createGenericContext<Context>();

export const WebvizBuildService: React.FC = props => {
    const dispatch = useAppDispatch();
    const mainProcessData = useMainProcessDataProvider();
    const [tempFilePath, setTempFilePath] = React.useState<string>("");
    const [tokenPath, setTokenPath] = React.useState<string>("");
    const activeFilePath = useAppSelector(state => state.files.activeFile);
    const currentFile = useAppSelector(state =>
        state.files.files.find(file => file.filePath === state.files.activeFile)
    );
    const currentView = useAppSelector(state => state.ui.currentPage);
    const webvizTheme = useAppSelector(state => state.preferences.webvizTheme);
    const pythonInterpreterPath = useAppSelector(
        state => state.preferences.pathToPythonInterpreter
    );
    const interval = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const [port, setPort] = React.useState<string>("");
    const [token, setToken] = React.useState<string>("");
    const [consoleMessages, setConsoleMessages] = React.useState<string[]>([]);
    const [builderState, setBuilderState] = React.useState<WebvizBuildState>(
        WebvizBuildState.Loading
    );

    const removeWebvizTokenFile = (rmPath: string) => {
        try {
            if (fs.existsSync(rmPath)) {
                fs.rmSync(rmPath);
            }
        } catch (e) {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: `Could not remove Webviz token file. ${e}`,
                })
            );
        }
    };

    React.useEffect(() => {
        if (
            !currentFile ||
            !currentFile.associatedWithFile ||
            currentView !== Pages.Play
        ) {
            return;
        }
        const tempPath = createTempFilePath(path.dirname(activeFilePath));
        setTempFilePath(tempPath);
        try {
            fs.writeFileSync(tempPath, currentFile.editorValue);
        } catch (e) {
            setBuilderState(WebvizBuildState.FileError);
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: `Could not fetch Webviz token and port. ${e}`,
                })
            );
        }
        return () => {
            if (fs.existsSync(tempPath)) {
                fs.rmSync(tempPath);
            }
        };
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [activeFilePath, currentView]);

    React.useEffect(() => {
        const data = ipcRenderer.sendSync("get-app-data");
        setTokenPath(path.resolve(data.userDataDir, "token"));
        removeWebvizTokenFile(path.resolve(data.userDataDir, "token"));
        /* eslint-disable react-hooks/exhaustive-deps */
    }, []);

    React.useEffect(() => {
        if (!currentFile || !currentFile.associatedWithFile) {
            setBuilderState(WebvizBuildState.UnsavedFile);
            return;
        }

        if (!fs.existsSync(tempFilePath)) {
            return;
        }

        setBuilderState(WebvizBuildState.Loading);

        const args = [path.resolve(tempFilePath)];

        if (webvizTheme !== "") {
            args.push(webvizTheme as string);
        } else {
            args.push("default");
        }

        args.push(path.resolve(mainProcessData.userDataDir, "token"));

        const data = ipcRenderer.sendSync("get-app-data");

        const options: Options = {
            mode: "text",
            pythonOptions: ["-u"],
            pythonPath: pythonInterpreterPath,
            args,
        };
        const pythonShell = new PythonShell(
            path.resolve(
                data.appDir,
                data.isDev ? "" : "..",
                "python",
                "webviz_build.py"
            ),
            options
        );

        pythonShell.on("message", chunk => {
            setConsoleMessages([...consoleMessages, chunk]);
        });

        pythonShell.on("error", error => {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: error.message,
                })
            );
        });

        pythonShell.on("pythonError", (error: PythonShellError) => {
            setBuilderState(WebvizBuildState.PythonError);
            setConsoleMessages([...consoleMessages, `\x1b[37;41m ${error}`]);
        });

        interval.current = setInterval(() => {
            try {
                if (fs.existsSync(tokenPath)) {
                    const [t, p] = fs
                        .readFileSync(tokenPath)
                        .toString()
                        .split("\n");
                    setToken(t);
                    setPort(p);
                    if (interval.current) {
                        clearInterval(interval.current);
                    }
                    setBuilderState(WebvizBuildState.Loaded);
                }
            } catch (e) {
                setBuilderState(WebvizBuildState.FileError);
                dispatch(
                    addNotification({
                        type: NotificationType.ERROR,
                        message: `Could not fetch Webviz token and port. ${e}`,
                    })
                );
            }
        }, 1000);

        return () => {
            if (pythonShell) {
                pythonShell.kill("SIGINT");
            }
            removeWebvizTokenFile(tokenPath);
        };
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [tempFilePath]);

    React.useEffect(() => {
        if (currentFile?.editorValue) {
            if (fs.existsSync(tempFilePath)) {
                fs.writeFileSync(tempFilePath, currentFile.editorValue);
            }
        }
    }, [currentFile?.editorValue, tempFilePath, currentView]);

    return (
        <WebvizBuildServiceContextProvider
            value={{token, port, consoleMessages, builderState}}
        >
            {props.children}
        </WebvizBuildServiceContextProvider>
    );
};

export const useWebvizBuildService = (): Context =>
    useWebvizBuildServiceContext();
