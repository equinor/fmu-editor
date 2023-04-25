import {DistOptions} from "@languages/dist";

import {Position, Range, editor, languages} from "monaco-editor";

import {Dist} from "../constants";

export function createKeywordsHoverProvider(options: DistOptions): languages.HoverProvider {
    return {
        provideHover(model: editor.IReadOnlyModel, position: Position): languages.ProviderResult<languages.Hover> {
            if (!options.hover) {
                return;
            }
            const wordAt = model.getWordAtPosition(position);
            if (!wordAt) {
                return;
            }
            const keyword = Dist.keywords.find(kw => kw.label === wordAt.word);
            if (!keyword) {
                return;
            }

            const range = new Range(position.lineNumber, wordAt.startColumn, position.lineNumber, wordAt.endColumn);
            return {
                range,
                contents: [
                    {value: keyword.detail},
                    // eslint-disable-next-line prefer-template
                    {value: "```\nVAR " + keyword.label + " " + keyword.usage + "\n```"},
                ],
            };
        },
    };
}
