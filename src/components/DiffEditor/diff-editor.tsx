import {useYamlSchemas} from "@hooks/useYamlSchema";
import {Close} from "@mui/icons-material";
import {Button, IconButton, useTheme} from "@mui/material";
import useSize from "@react-hook/size";
import {useFileChangesWatcher} from "@services/file-changes-service";
import {notificationsService} from "@services/notifications-service";

import React from "react";
import {VscSave, VscWarning} from "react-icons/vsc";
import {DiffEditorDidMount, MonacoDiffEditor, monaco} from "react-monaco-editor";

import {File} from "@utils/file-system/file";

import {useGlobalSettings} from "@components/GlobalSettingsProvider/global-settings-provider";
import {Surface} from "@components/Surface";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setDiffFiles} from "@redux/reducers/ui";

import {FileChangeOrigin} from "@shared-types/file-changes";
import {NotificationType} from "@shared-types/notifications";

// @ts-ignore
import {languages} from "monaco-editor";
import path from "path";

import "./diff-editor.css";

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

export const DiffEditor: React.VFC = () => {
    const [visible, setVisible] = React.useState<boolean>(false);
    const [originalEditorWidth, setOriginalEditorWidth] = React.useState<number>(0);
    const [conflicts, setConflicts] = React.useState<monaco.editor.IChange[]>([]);
    const [originalFileExists, setOriginalFileExists] = React.useState<boolean>(false);
    const [modifiedFileExists, setModifiedFileExists] = React.useState<boolean>(false);
    const [relativeFilePath, setRelativeFilePath] = React.useState<string>("");

    const monacoDiffEditorRef = React.useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
    const diffEditorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoDiffRef = React.useRef<typeof monaco | null>(null);
    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const fontSize = useAppSelector(state => state.ui.settings.editorFontSize);
    const diff = useAppSelector(state => state.ui.diff);
    const workingDirectoryPath = useAppSelector(state => state.files.workingDirectoryPath);

    const dispatch = useAppDispatch();
    const theme = useTheme();
    const globalSettings = useGlobalSettings();
    const {snapshot} = useFileChangesWatcher();
    const [diffEditorTotalWidth, diffEditorTotalHeight] = useSize(diffEditorRef);

    useYamlSchemas(yaml);

    React.useEffect(() => {
        const timeoutRef = timeout.current;
        return () => {
            if (timeoutRef) {
                clearTimeout(timeoutRef);
            }
        };
    }, [timeout]);

    const handleDiffUpdate = () => {
        if (monacoDiffEditorRef.current) {
            setConflicts(monacoDiffEditorRef.current.getLineChanges());
        }
    };

    const handleDiffEditorDidMount: DiffEditorDidMount = (editor, monacoInstance) => {
        monacoDiffEditorRef.current = editor;
        monacoDiffRef.current = monacoInstance;
        editor.getOriginalEditor().onDidLayoutChange(handleLayoutChange);
        editor.onDidUpdateDiff(handleDiffUpdate);
    };

    React.useEffect(() => {
        if (!monacoDiffEditorRef || !monacoDiffEditorRef.current) {
            return;
        }
        monacoDiffEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoDiffEditorRef]);

    React.useLayoutEffect(() => {
        if (diff.originalRelativeFilePath) {
            const originalFile = new File(diff.originalRelativeFilePath, workingDirectoryPath);
            setOriginalFileExists(originalFile.exists());
            setRelativeFilePath(originalFile.getMainVersion().relativePath());
            return;
        }
        setOriginalFileExists(false);
    }, [diff.originalRelativeFilePath, workingDirectoryPath]);

    React.useLayoutEffect(() => {
        if (diff.modifiedRelativeFilePath) {
            const originalFile = new File(diff.modifiedRelativeFilePath, workingDirectoryPath);
            setModifiedFileExists(originalFile.exists());
            return;
        }
        setModifiedFileExists(false);
    }, [diff.modifiedRelativeFilePath, workingDirectoryPath]);

    React.useEffect(() => {
        if (
            !diff.originalRelativeFilePath ||
            !diff.modifiedRelativeFilePath ||
            !globalSettings.supportedFileExtensions.includes(path.extname(diff.originalRelativeFilePath))
        ) {
            monacoDiffEditorRef.current?.setModel({
                original: monaco.editor.createModel("", "yaml"),
                modified: monaco.editor.createModel("", "yaml"),
            });
            setVisible(false);
            if (
                diff.originalRelativeFilePath &&
                diff.modifiedRelativeFilePath &&
                !globalSettings.supportedFileExtensions.includes(path.extname(diff.originalRelativeFilePath))
            ) {
                notificationsService.publishNotification({
                    type: NotificationType.INFORMATION,
                    message: `You can only use the diff editor for files with the following extensions: ${globalSettings.supportedFileExtensions.join(
                        ", "
                    )}`,
                });
            }
            return;
        }

        setVisible(true);

        if (diff.modifiedRelativeFilePath && diff.originalRelativeFilePath) {
            let userModel = monaco.editor.getModel(monaco.Uri.file(diff.modifiedRelativeFilePath));
            const mergeUserFile = new File(diff.modifiedRelativeFilePath, workingDirectoryPath);
            if (!userModel) {
                userModel = monaco.editor.createModel(
                    mergeUserFile.readString(),
                    globalSettings.languageForFileExtension(path.extname(diff.modifiedRelativeFilePath)),
                    monaco.Uri.file(diff.modifiedRelativeFilePath)
                );
            } else {
                userModel.setValue(mergeUserFile.readString());
            }

            let mainModel = monaco.editor.getModel(monaco.Uri.file(diff.originalRelativeFilePath));
            const mergeMainFile = new File(diff.originalRelativeFilePath, workingDirectoryPath);
            if (!mainModel) {
                mainModel = monaco.editor.createModel(
                    mergeMainFile.readString(),
                    globalSettings.languageForFileExtension(path.extname(diff.modifiedRelativeFilePath)),
                    monaco.Uri.file(diff.originalRelativeFilePath)
                );
            } else {
                mainModel.setValue(mergeMainFile.readString());
            }

            if (userModel) {
                if (monacoDiffEditorRef.current && monacoDiffRef.current) {
                    monacoDiffEditorRef.current.setModel({
                        original: mainModel,
                        modified: userModel,
                    });
                    monacoDiffEditorRef.current.focus();
                }
            }
        }
    }, [
        workingDirectoryPath,
        dispatch,
        globalSettings.supportedFileExtensions,
        diff.originalRelativeFilePath,
        diff.modifiedRelativeFilePath,
        globalSettings,
    ]);

    const handleClose = () => {
        dispatch(setDiffFiles({mainFile: undefined, userFile: undefined, origin: undefined}));
        setVisible(false);
    };

    const handleLayoutChange = (layout: monaco.editor.EditorLayoutInfo) => {
        setOriginalEditorWidth(layout.contentWidth);
    };

    const handleSave = () => {
        if (diff.modifiedRelativeFilePath && diff.originalRelativeFilePath) {
            const mergeUserFile = new File(diff.modifiedRelativeFilePath, workingDirectoryPath);
            const userModel = monaco.editor.getModel(monaco.Uri.file(diff.modifiedRelativeFilePath));
            if (userModel && mergeUserFile.writeString(userModel.getValue())) {
                snapshot.updateModified(diff.originalRelativeFilePath);
                notificationsService.publishNotification({
                    type: NotificationType.INFORMATION,
                    message: "Saved merged file",
                });
                dispatch(setDiffFiles({mainFile: undefined, userFile: undefined, origin: undefined}));
                setVisible(false);
            } else {
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: "Failed to save merged file",
                });
            }
        }
    };

    return (
        <div className="EditorWrapper" style={{display: visible ? "block" : "none"}}>
            <Surface elevation="raised" className="MergeEditorFile">
                {diff.fileOrigin === FileChangeOrigin.BOTH && <VscWarning color={theme.palette.warning.main} />}
                <strong>{relativeFilePath}</strong>
                {diff.fileOrigin === FileChangeOrigin.BOTH &&
                    `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"}`}
                <div>
                    {diff.fileOrigin === FileChangeOrigin.BOTH && (
                        <Button
                            onClick={() => handleSave()}
                            variant="contained"
                            color="primary"
                            startIcon={<VscSave />}
                            size="small"
                        >
                            Save User Version
                        </Button>
                    )}
                    <IconButton onClick={() => handleClose()}>
                        <Close />
                    </IconButton>
                </div>
            </Surface>
            <div ref={diffEditorRef} className="EditorContainer">
                <Surface elevation="raised" className="DiffEditorHeader">
                    <div style={{width: originalEditorWidth}} className="EditorHeaderTitle">
                        <div>
                            <strong>{diff.fileOrigin === FileChangeOrigin.BOTH ? "Main" : "Original"}</strong>
                            {diff.fileOrigin !== FileChangeOrigin.BOTH && <i>{diff.originalRelativeFilePath}</i>}
                        </div>
                    </div>
                    <div style={{width: `calc(100% - 48px - ${originalEditorWidth}px)`}} className="EditorHeaderTitle">
                        <div>
                            <strong>{diff.fileOrigin === FileChangeOrigin.BOTH ? "User (output)" : "Modified"}</strong>
                            {diff.fileOrigin !== FileChangeOrigin.BOTH && <i>{diff.modifiedRelativeFilePath}</i>}
                        </div>
                    </div>
                </Surface>
                {!originalFileExists && (
                    <div className="EditorOverlay" style={{left: 0, width: originalEditorWidth + 47, top: 75}}>
                        File does not exist here
                    </div>
                )}
                {!modifiedFileExists && (
                    <div
                        className="EditorOverlay"
                        style={{
                            left: originalEditorWidth + 48,
                            width: `calc(100% - 48px - ${originalEditorWidth}px)`,
                            top: 75,
                        }}
                    >
                        File does not exist here
                    </div>
                )}
                <MonacoDiffEditor
                    language="yaml"
                    defaultValue=""
                    className="YamlEditor"
                    editorDidMount={handleDiffEditorDidMount}
                    theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                    options={{
                        readOnly: diff.fileOrigin !== FileChangeOrigin.BOTH,
                    }}
                    width={diffEditorTotalWidth}
                    height={diffEditorTotalHeight - 30}
                />
            </div>
        </div>
    );
};
