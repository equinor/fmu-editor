import {LanguageOptions} from "@shared-types/language-options";

import {Position, Range, editor, languages} from "monaco-editor";

import {Ert} from "../constants";

export function createKeywordsCompletionProvider(options: LanguageOptions): languages.CompletionItemProvider {
    return {
        provideCompletionItems(model: editor.IReadOnlyModel, position: Position): languages.CompletionList {
            const word = model.getWordUntilPosition(position);
            // TODO: account for preceding whitespace? Or enforce good spacing?
            if (word.startColumn !== 1 || !options.completion) {
                return {suggestions: []};
            }

            const range = new Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
            const suggestions = Ert.keywords.map(kw => {
                const copy: languages.CompletionItem = {...kw, range};
                if (!options.snippets) {
                    copy.insertText = `${kw.label} `;
                    copy.insertTextRules = languages.CompletionItemInsertTextRule.KeepWhitespace;
                }
                return copy;
            });

            return {
                suggestions,
            };
        },
    };
}
