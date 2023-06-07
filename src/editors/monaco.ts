/* eslint-disable max-classes-per-file */
import {GlobalSettings} from "@global/global-settings";

import {monaco} from "react-monaco-editor";

import {File} from "@utils/file-system/file";
import {generateHashCode} from "@utils/hash";

import path from "path";

import {IEditor, IEditorBasic} from "./editor-basic";

export class MonacoEditor implements Omit<IEditor<monaco.editor.ITextModel>, keyof IEditorBasic> {
    // eslint-disable-next-line class-methods-use-this
    public getHashCode(absoluteFilePath: string): string | false {
        let value = "";
        try {
            const uri = monaco.Uri.file(absoluteFilePath);
            const model = monaco.editor.getModel(uri);
            if (model) {
                value = model.getValue();
            } else {
                const file = new File(absoluteFilePath, "");
                if (file.exists()) {
                    value = file.readString();
                }
            }
            return generateHashCode(value);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // eslint-disable-next-line class-methods-use-this
    public openFile(absoluteFilePath: string): void {
        const currentFile = new File(absoluteFilePath, "");
        if (monaco.editor.getModel(monaco.Uri.file(absoluteFilePath))) {
            return;
        }
        monaco.editor.createModel(
            currentFile.readString(),
            GlobalSettings.languageForFileExtension(path.extname(absoluteFilePath)),
            monaco.Uri.file(absoluteFilePath)
        );
    }

    // eslint-disable-next-line class-methods-use-this
    public getModel<T>(absoluteFilePath: string): T | null {
        const uri = monaco.Uri.file(absoluteFilePath);
        // @ts-ignore
        return (monaco.editor.getModel(uri) as T) || null;
    }

    // eslint-disable-next-line class-methods-use-this
    public closeFile(absoluteFilePath: string): void {
        const uri = monaco.Uri.file(absoluteFilePath);
        const model = monaco.editor.getModel(uri);
        if (model) {
            model.dispose();
        }
    }

    // eslint-disable-next-line class-methods-use-this
    public saveFile(absoluteFilePath: string): boolean {
        const uri = monaco.Uri.file(absoluteFilePath);
        const model = monaco.editor.getModel(uri);
        if (!model) {
            return false;
        }
        const file = new File(absoluteFilePath, "");
        return file.writeString(model.getValue());
    }

    // eslint-disable-next-line class-methods-use-this
    public saveFileAs(absoluteFilePath: string, newAbsoluteFilePath: string): boolean {
        const uri = monaco.Uri.file(absoluteFilePath);
        const model = monaco.editor.getModel(uri);
        if (!model) {
            return false;
        }
        const file = new File(newAbsoluteFilePath, "");
        return file.writeString(model.getValue());
    }
}

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
