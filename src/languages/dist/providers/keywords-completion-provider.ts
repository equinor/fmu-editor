import {DistOptions} from "@languages/dist";

import {Position, Range, editor, languages} from "monaco-editor";

import {Dist} from "../constants";

export function createKeywordsCompletionProvider(options: DistOptions): languages.CompletionItemProvider {
    return {
        provideCompletionItems(model: editor.IReadOnlyModel, position: Position): languages.CompletionList {
            if (!options.completion) {
                return {suggestions: []};
            }

            const word = model.getWordUntilPosition(position);
            const range = new Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
            const suggestions = Dist.keywords.map(kw => {
                return <languages.CompletionItem>{...kw, range};
            });
            return {suggestions};
        },
    };
}
