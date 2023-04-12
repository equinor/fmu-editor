/* eslint-disable no-useless-escape */
import {languages} from "monaco-editor";

import {Dist, Regex, languageId} from "./constants";

export const monarchConfiguration: languages.LanguageConfiguration = {
    wordPattern: /(-?\d*\.-\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\<\>\/\?\s]+)/g,
    comments: {
        lineComment: "--",
    },
};

export const monarchLanguage: languages.IMonarchLanguage = {
    defaultToken: "invalid",
    tokenPostfix: `.${languageId}`,

    keywords: Dist.keywords.map(kw => kw.label),

    keyword: Regex.keyword,
    comment: Regex.comment,
    digits: Regex.digits,

    tokenizer: {
        root: [
            {include: "@whitespace"},
            [
                /@keyword/,
                {
                    cases: {
                        "@keywords": "keyword",
                        "@default": "identifier",
                    },
                },
            ],
            {include: "@numbers"},
        ],

        whitespace: [
            [/[\s]+/, "white"],
            [/@comment/, "comment"],
        ],

        numbers: [
            [/(@digits)[eE]([-+]?(@digits))?/, "number"],
            [/(@digits)\.(@digits)([eE][-+]?(@digits))?/, "number"],
            [/[-]?(@digits)n?/, "number"],
        ],
    },
};
