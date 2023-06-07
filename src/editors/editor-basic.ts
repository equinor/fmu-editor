import electronStore from "@utils/electron-store";

import {CodeEditorViewState, SpreadSheetEditorViewState} from "@shared-types/files";

export interface IEditorBasic {
    getViewState(absoluteFilePath: string): CodeEditorViewState | null;
    setViewState(absoluteFilePath: string, viewState: CodeEditorViewState): void;
    clear(): void;
    clearForFile(absoluteFilePath: string): void;
}

export interface IEditor<T> {
    getViewState(absoluteFilePath: string): CodeEditorViewState | null;
    setViewState(absoluteFilePath: string, viewState: CodeEditorViewState): void;
    clear(): void;
    clearForFile(absoluteFilePath: string): void;
    getHashCode(absoluteFilePath: string): string | false;
    openFile(absoluteFilePath: string): void;
    getModel<K extends T>(absoluteFilePath: string): K | null;
    closeFile(absoluteFilePath: string): void;
    saveFile(absoluteFilePath: string): boolean;
    saveFileAs(absoluteFilePath: string, newAbsoluteFilePath: string): boolean;
}

export class EditorBasic implements IEditorBasic {
    private viewStates: Record<string, CodeEditorViewState | SpreadSheetEditorViewState>;

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

    public getViewState<K = CodeEditorViewState | SpreadSheetEditorViewState>(filePath: string): K | null {
        return (this.viewStates[filePath] as K) || null;
    }

    public setViewState(filePath: string, viewState: CodeEditorViewState | SpreadSheetEditorViewState) {
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
