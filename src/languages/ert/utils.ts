import {Position, Range, editor} from "monaco-editor";

export function textUntilPosition(model: editor.ITextModel, position: Position): string {
    return model.getValueInRange(new Range(position.lineNumber, 1, position.lineNumber, position.column));
}

export function textAfterPosition(model: editor.ITextModel, position: Position): string {
    return model.getValueInRange(
        new Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            model.getLineLength(position.lineNumber) + 1
        )
    );
}
