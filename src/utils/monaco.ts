/* eslint-disable max-classes-per-file */
import {monaco} from "react-monaco-editor";

import {CodeEditorViewState} from "@shared-types/files";

import electronStore from "./electron-store";
import {File} from "./file-system/file";

export function getEditorValue(filePath: string): string | null {
    const uri = monaco.Uri.file(filePath);
    const model = monaco.editor.getModel(uri);
    if (model) {
        return model.getValue();
    }
    const file = new File(filePath, "");
    if (file.exists()) {
        return file.readString();
    }
    return null;
}

class MonacoViewStateManager {
    private viewStates: Record<string, CodeEditorViewState>;
    constructor() {
        this.viewStates = {};
        this.loadFromStore();
    }

    private loadFromStore() {
        const files = electronStore.get("files.files", []);
        files.forEach(file => {
            if (file.editorViewState) {
                this.viewStates[file.filePath] = JSON.parse(file.editorViewState);
            }
        });
    }

    private saveToStore() {
        const files = electronStore.get("files.files", []);
        const adjustedFiles = files.map(file => {
            if (this.viewStates[file.filePath]) {
                return {...file, editorViewState: JSON.stringify(this.viewStates[file.filePath])};
            }
            return {...file, editorViewState: "null"};
        });
        electronStore.set("files.files", adjustedFiles);
    }

    public getViewState(filePath: string): CodeEditorViewState | null {
        return this.viewStates[filePath] || null;
    }

    public setViewState(filePath: string, viewState: CodeEditorViewState) {
        this.viewStates[filePath] = viewState;
        this.saveToStore();
    }

    public clear() {
        this.viewStates = {};
        this.saveToStore();
    }

    public clearForFile(filePath: string) {
        delete this.viewStates[filePath];
        this.saveToStore();
    }
}

export const monacoViewStateManager = new MonacoViewStateManager();

class MonacoMainEditorInstances {
    private monacoEditorInstance: monaco.editor.IStandaloneCodeEditor | null;
    private monacoInstance: typeof monaco | null;

    constructor() {
        this.monacoEditorInstance = null;
        this.monacoInstance = null;
    }

    public setMonacoInstance(monacoInstance: typeof monaco) {
        this.monacoInstance = monacoInstance;
    }

    public setMonacoEditorInstance(monacoEditorInstance: monaco.editor.IStandaloneCodeEditor) {
        this.monacoEditorInstance = monacoEditorInstance;
    }

    public getMonacoEditorInstance(): monaco.editor.IStandaloneCodeEditor | null {
        return this.monacoEditorInstance;
    }

    public getMonacoInstance(): typeof monaco | null {
        return this.monacoInstance;
    }
}

export const monacoMainEditorInstances = new MonacoMainEditorInstances();
