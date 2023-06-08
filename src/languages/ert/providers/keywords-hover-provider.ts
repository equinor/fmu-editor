import {LanguageOptions} from "@shared-types/language-options";

import {Position, Range, editor, languages} from "monaco-editor";

import {Ert} from "../constants";

export function createKeywordsHoverProvider(options: LanguageOptions): languages.HoverProvider {
    return {
        provideHover(model: editor.IReadOnlyModel, position: Position): languages.ProviderResult<languages.Hover> {
            const wordUntil = model.getWordUntilPosition(position);
            if (wordUntil.startColumn !== 1 || !options.hover) {
                return;
            }
            const wordAt = model.getWordAtPosition(position);
            if (!wordAt) {
                return;
            }
            const keyword = Ert.keywords.find(kw => kw.label === wordAt.word);
            if (!keyword) {
                return;
            }

            const range = new Range(position.lineNumber, wordAt.startColumn, position.lineNumber, wordAt.endColumn);
            return {
                range,
                contents: [
                    {value: keyword.detail},
                    // eslint-disable-next-line prefer-template
                    {value: "```\n" + keyword.label + " " + keyword.usage + "\n```"},
                ],
            };
        },
    };
}
