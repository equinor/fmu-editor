import {EditorType, GlobalSettings} from "@global/global-settings";

import {monaco} from "react-monaco-editor";

import path from "path";
import {WorkBook} from "xlsx";

import {EditorBasic, IEditor} from "./editor-basic";
import {MonacoEditor} from "./monaco";
import {SpreadSheetEditor} from "./spreadsheet";

class Editor extends EditorBasic implements IEditor<WorkBook | monaco.editor.ITextModel> {
    private monacoEditor: MonacoEditor;
    private spreadSheetEditor: SpreadSheetEditor;

    constructor() {
        super();
        this.monacoEditor = new MonacoEditor();
        this.spreadSheetEditor = new SpreadSheetEditor();
    }

    public getHashCode(absoluteFilePath: string): string {
        switch (GlobalSettings.editorTypeForFileExtension(path.extname(absoluteFilePath))) {
            case EditorType.Monaco:
                return this.monacoEditor.getHashCode(absoluteFilePath);
            case EditorType.SpreadSheet:
                return this.spreadSheetEditor.getHashCode(absoluteFilePath);
            default:
                return "";
        }
    }

    public openFile(absoluteFilePath: string): void {
        switch (GlobalSettings.editorTypeForFileExtension(path.extname(absoluteFilePath))) {
            case EditorType.Monaco:
                this.monacoEditor.openFile(absoluteFilePath);
                break;
            case EditorType.SpreadSheet:
                this.spreadSheetEditor.openFile(absoluteFilePath);
                break;
            default:
                break;
        }
    }

    public getModel<K = monaco.editor.ITextModel | WorkBook>(absoluteFilePath: string): K | null {
        switch (GlobalSettings.editorTypeForFileExtension(path.extname(absoluteFilePath))) {
            case EditorType.Monaco:
                return this.monacoEditor.getModel(absoluteFilePath) as K | null;
            case EditorType.SpreadSheet:
                return this.spreadSheetEditor.getModel(absoluteFilePath) as K | null;
            default:
                return null;
        }
    }

    public closeFile(absoluteFilePath: string): void {
        switch (GlobalSettings.editorTypeForFileExtension(path.extname(absoluteFilePath))) {
            case EditorType.Monaco:
                this.monacoEditor.closeFile(absoluteFilePath);
                break;
            case EditorType.SpreadSheet:
                this.spreadSheetEditor.closeFile(absoluteFilePath);
                break;
            default:
                break;
        }
    }

    public saveFile(absoluteFilePath: string): boolean {
        switch (GlobalSettings.editorTypeForFileExtension(path.extname(absoluteFilePath))) {
            case EditorType.Monaco:
                return this.monacoEditor.saveFile(absoluteFilePath);
            case EditorType.SpreadSheet:
                return this.spreadSheetEditor.saveFile(absoluteFilePath);
            default:
                return false;
        }
    }

    public saveFileAs(absoluteFilePath: string, newAbsoluteFilePath: string): boolean {
        switch (GlobalSettings.editorTypeForFileExtension(path.extname(absoluteFilePath))) {
            case EditorType.Monaco:
                return this.monacoEditor.saveFileAs(absoluteFilePath, newAbsoluteFilePath);
            case EditorType.SpreadSheet:
                return this.spreadSheetEditor.saveFileAs(absoluteFilePath, newAbsoluteFilePath);
            default:
                return false;
        }
    }
}

export const editor = new Editor();
