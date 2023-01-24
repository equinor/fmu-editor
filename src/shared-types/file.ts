import {Selection, editor} from "monaco-editor/esm/vs/editor/editor.api";

export type File = {
    uuid: string;
    editorModel: editor.IModel;
    editorViewState: editor.ICodeEditorViewState | null;
    unsavedChanges: boolean;
    selection: Selection;
};
