import {useYamlSchemas} from "@hooks/useYamlSchema";
import {CheckBox, Close} from "@mui/icons-material";
import {Button, IconButton, useTheme} from "@mui/material";
import useSize from "@react-hook/size";
import {useFileManager} from "@services/file-manager";

import React from "react";
import MonacoEditor, {DiffEditorDidMount, EditorDidMount, MonacoDiffEditor, monaco} from "react-monaco-editor";

import {File} from "@utils/file-system/file";

import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setActiveDiffFile} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {setOngoingChangesFile, setView} from "@redux/reducers/ui";

import {NotificationType} from "@shared-types/notifications";
import {View} from "@shared-types/ui";

// @ts-ignore
import {languages} from "monaco-editor";
import path from "path";

import "./merge-editor.css";

declare global {
    interface Window {
        MonacoEnvironment?: monaco.Environment;
    }
}

window.MonacoEnvironment = {
    getWorker(moduleId, label) {
        switch (label) {
            case "editorWorkerService":
                return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url));
            case "css":
            case "less":
            case "scss":
                return new Worker(new URL("monaco-editor/esm/vs/language/css/css.worker", import.meta.url));
            case "handlebars":
            case "html":
            case "razor":
                return new Worker(new URL("monaco-editor/esm/vs/language/html/html.worker", import.meta.url));
            case "json":
                return new Worker(new URL("monaco-editor/esm/vs/language/json/json.worker", import.meta.url));
            case "javascript":
            case "typescript":
                return new Worker(new URL("monaco-editor/esm/vs/language/typescript/ts.worker", import.meta.url));
            case "yaml":
                return new Worker(new URL("monaco-yaml/yaml.worker", import.meta.url));
            default:
                throw new Error(`Unknown label ${label}`);
        }
    },
};

// @ts-ignore
const {yaml} = languages || {};

export const MergeEditor: React.VFC = () => {
    const [visible, setVisible] = React.useState<boolean>(false);
    const [originalEditorWidth, setOriginalEditorWidth] = React.useState<number>(0);
    const [conflicts, setConflicts] = React.useState<monaco.editor.IChange[] | null>(null);
    const [currentConflictIndex, setCurrentConflictIndex] = React.useState<number>(0);

    const monacoEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoDiffEditorRef = React.useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
    const diffEditorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoDiffRef = React.useRef<typeof monaco | null>(null);

    const [diffEditorTotalWidth, diffEditorTotalHeight] = useSize(diffEditorRef);

    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();

    const fontSize = useAppSelector(state => state.ui.settings.editorFontSize);
    const mergeMainFilePath = useAppSelector(state => state.ui.mergeMainFile);
    const mergeUserFilePath = useAppSelector(state => state.ui.mergeUserFile);
    const currentDirectory = useAppSelector(state => state.files.directory);
    const dispatch = useAppDispatch();
    const {fileManager} = useFileManager();
    const globalSettings = useGlobalSettings();

    useYamlSchemas(yaml);

    React.useEffect(() => {
        const timeoutRef = timeout.current;
        return () => {
            if (timeoutRef) {
                clearTimeout(timeoutRef);
            }
        };
    }, [timeout]);

    const handleDiffEditorScroll = (e: monaco.IScrollEvent) => {
        if (monacoDiffEditorRef.current) {
            monacoEditorRef.current.setScrollPosition({
                scrollTop: e.scrollTop,
                scrollLeft: e.scrollLeft,
            });
        }
    };

    const handleEditorScroll = (e: monaco.IScrollEvent) => {
        if (monacoDiffEditorRef.current) {
            monacoDiffEditorRef.current.getModifiedEditor().setScrollPosition({
                scrollTop: e.scrollTop,
                scrollLeft: e.scrollLeft,
            });
        }
    };

    const handleEditorDidMount: EditorDidMount = (editor, monacoInstance) => {
        monacoEditorRef.current = editor;
        editor.onDidScrollChange(handleEditorScroll);
        editor.updateOptions({
            lineNumbers: (lineNumber: number) => {
                return `<span style="padding: 20px;">${lineNumber}</span>`;
            },
        });
    };

    const handleDiffUpdate = () => {
        if (monacoDiffEditorRef.current) {
            setConflicts(monacoDiffEditorRef.current.getLineChanges());
        }
    };

    const handleDiffEditorDidMount: DiffEditorDidMount = (editor, monacoInstance) => {
        monacoDiffEditorRef.current = editor;
        monacoDiffRef.current = monacoInstance;
        editor.getOriginalEditor().onDidLayoutChange(handleLayoutChange);
        editor.getOriginalEditor().onDidScrollChange(handleDiffEditorScroll);
        editor.onDidUpdateDiff(handleDiffUpdate);
    };

    React.useEffect(() => {
        if (!monacoDiffEditorRef || !monacoDiffEditorRef.current) {
            return;
        }
        monacoDiffEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoDiffEditorRef]);

    React.useEffect(() => {
        if (
            !mergeMainFilePath ||
            !mergeUserFilePath ||
            !globalSettings.supportedFileExtensions.includes(path.extname(mergeMainFilePath))
        ) {
            monacoDiffEditorRef.current?.setModel({
                original: monaco.editor.createModel("", "yaml"),
                modified: monaco.editor.createModel("", "yaml"),
            });
            setVisible(false);
            if (
                mergeMainFilePath &&
                mergeUserFilePath &&
                !globalSettings.supportedFileExtensions.includes(path.extname(mergeMainFilePath))
            ) {
                dispatch(
                    addNotification({
                        type: NotificationType.INFORMATION,
                        message: `You can only use the diff editor for files with the following extensions: ${globalSettings.supportedFileExtensions.join(
                            ", "
                        )}`,
                    })
                );
            }
            return;
        }

        setVisible(true);

        if (mergeUserFilePath && mergeMainFilePath) {
            let userModel = monaco.editor.getModel(monaco.Uri.file(mergeUserFilePath));
            const mergeUserFile = new File(mergeUserFilePath, currentDirectory);
            if (!userModel) {
                userModel = monaco.editor.createModel(
                    mergeUserFile.readString(),
                    globalSettings.languageForFileExtension(path.extname(mergeUserFilePath)),
                    monaco.Uri.file(mergeUserFilePath)
                );
            } else {
                userModel.setValue(mergeUserFile.readString());
            }

            let diffModel = monaco.editor.getModel(monaco.Uri.file(mergeMainFilePath));
            const mergeMainFile = new File(mergeMainFilePath, currentDirectory);
            if (!diffModel) {
                diffModel = monaco.editor.createModel(
                    mergeMainFile.readString(),
                    globalSettings.languageForFileExtension(path.extname(mergeUserFilePath)),
                    monaco.Uri.file(mergeMainFilePath)
                );
            } else {
                diffModel.setValue(mergeMainFile.readString());
            }

            let outputModel = monaco.editor.getModel(monaco.Uri.file(path.join("~output", mergeUserFilePath)));
            if (!outputModel) {
                outputModel = monaco.editor.createModel(
                    mergeUserFile.readString(),
                    globalSettings.languageForFileExtension(path.extname(mergeUserFilePath)),
                    monaco.Uri.file(path.join("~output", mergeUserFilePath))
                );
            } else {
                outputModel.setValue(mergeUserFile.readString());
            }

            if (userModel) {
                if (monacoDiffEditorRef.current && monacoDiffRef.current) {
                    monacoDiffEditorRef.current.setModel({
                        original: diffModel ?? userModel,
                        modified: userModel,
                    });
                    monacoDiffEditorRef.current.focus();
                }
                if (monacoEditorRef.current) {
                    monacoEditorRef.current.setModel(outputModel);
                }
            }
        }
    }, [
        currentDirectory,
        dispatch,
        fileManager,
        globalSettings.supportedFileExtensions,
        mergeMainFilePath,
        mergeUserFilePath,
        globalSettings,
    ]);

    const handleClose = () => {
        dispatch(setActiveDiffFile({relativeFilePath: null}));
        dispatch(setOngoingChangesFile(undefined));
        dispatch(setView(View.Main));
        setVisible(false);
    };

    const handleLayoutChange = (layout: monaco.editor.EditorLayoutInfo) => {
        setOriginalEditorWidth(layout.contentWidth);
    };

    const handleUseOriginalValue = () => {
        if (monacoDiffEditorRef.current && monacoEditorRef.current) {
            const originalModel = monacoDiffEditorRef.current.getOriginalEditor().getModel();
            const outputModel = monacoEditorRef.current.getModel();
            if (originalModel && outputModel) {
                outputModel.setValue(originalModel.getValue());
            }
        }
    };

    const handleUseModifiedValue = () => {
        if (monacoDiffEditorRef.current && monacoEditorRef.current) {
            const modifiedModel = monacoDiffEditorRef.current.getModifiedEditor().getModel();
            const outputModel = monacoEditorRef.current.getModel();
            if (modifiedModel && outputModel) {
                outputModel.setValue(modifiedModel.getValue());
            }
        }
    };

    return (
        <div className="EditorWrapper">
            <div ref={diffEditorRef} className="EditorContainer" style={{display: visible ? "block" : "none"}}>
                <Surface elevation="raised" className="DiffEditorHeader">
                    <div style={{width: originalEditorWidth}}>
                        <strong>User</strong> <i>({mergeUserFilePath || ""})</i>
                        <Button onClick={handleUseOriginalValue}>Use user version</Button>
                    </div>
                    <div style={{width: `calc(100% - 130px - ${originalEditorWidth}px)`}}>
                        <strong>Main</strong> <i>({mergeMainFilePath || ""})</i>
                        <Button onClick={handleUseModifiedValue}>Use main version</Button>
                    </div>
                    <IconButton onClick={() => handleClose()}>
                        <Close />
                    </IconButton>
                </Surface>
                <MonacoDiffEditor
                    language="yaml"
                    defaultValue=""
                    className="YamlEditor"
                    editorDidMount={handleDiffEditorDidMount}
                    theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                    options={{
                        readOnly: true,
                    }}
                    width={diffEditorTotalWidth}
                    height={diffEditorTotalHeight / 2 - 56}
                />
                <Surface elevation="raised" className="DiffEditorHeader">
                    <div>
                        <strong>Output</strong>
                        <div className="DiffEditorConflictsNavigation">
                            {conflicts && `Conflict ${currentConflictIndex + 1} of ${conflicts.length}`}
                        </div>
                    </div>
                </Surface>
                <MonacoEditor
                    className="YamlEditor"
                    defaultValue=""
                    editorDidMount={handleEditorDidMount}
                    theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                    width={diffEditorTotalWidth}
                    height={diffEditorTotalHeight / 2 - 56}
                />
            </div>
        </div>
    );
};
