import {languages} from "monaco-editor";

import {Ert, Regex, languageId} from "./constants";

export const monarchConfiguration: languages.LanguageConfiguration = {
    comments: {
        lineComment: "--",
    },
    surroundingPairs: [
        {open: "<", close: ">"},
        {open: "(", close: ")"},
        {open: "'", close: "'"},
        {open: '"', close: '"'},
    ],
    autoClosingPairs: [
        {open: "'", close: "'", notIn: ["string", "comment"]},
        {open: '"', close: '"', notIn: ["comment"]},
        {open: "(", close: ")"},
        {open: "<", close: ">"},
    ],
};

export const monarchLanguage: languages.IMonarchLanguage = {
    defaultToken: "invalid",
    tokenPostfix: `.${languageId}`,

    keywords: Ert.keywords.map(kw => kw.label),
    deprecated: Ert.keywords
        .filter(kw => kw.tags?.includes(languages.CompletionItemTag.Deprecated))
        .map(kw => kw.label),

    /* Sub-keywords for queue configuration */
    lsfConfig: Ert.lsfConfig,
    slurmConfig: Ert.slurmConfig,
    torqueConfig: Ert.torqueConfig,

    /* A loose definition of "types" in ERT configurations */
    queueTypes: Ert.queues.map(q => q.label),
    summaryVectors: Ert.summaryVectors.map(v => v.label),
    workflowHookPoints: Ert.workflowHookPoints.map(h => h.label),

    /* Precise highlighting for the arguments in ERT
     * keywords that take parameters.
     */
    fieldParameters: Ert.keywords.find(kw => kw.label === "FIELD")?.parameters.map(param => param.label),
    genDataParameters: Ert.keywords.find(kw => kw.label === "GEN_DATA")?.parameters.map(param => param.label),
    surfaceParameters: Ert.keywords.find(kw => kw.label === "SURFACE")?.parameters.map(param => param.label),

    /* Localize the regex */
    keyword: Regex.keyword,
    unquotedString: Regex.unquotedString,
    reference: Regex.reference,
    envVar: Regex.envVar,
    summaryVector: Regex.summaryVector,
    comment: Regex.comment,
    booleans: Regex.booleans,
    fwdModelRegex: Regex.forwardModel,
    floatNum: Regex.floatNum,
    num: Regex.num,

    tokenizer: {
        root: [
            [
                /@keyword/,
                {
                    cases: {
                        "@keywords": {
                            cases: {
                                "@eos": "invalid", // Enforce keywords followed by something
                                FIELD: {token: "keyword", next: "@field"},
                                GEN_DATA: {token: "keyword", next: "@genData"},
                                SURFACE: {token: "keyword", next: "@surface"},
                                HOOK_WORKFLOW: {token: "keyword", next: "@hookWorkflow"},
                                GEN_KW: {token: "keyword", next: "@hasIdentifier"},
                                INSTALL_JOB: {token: "keyword", next: "@hasIdentifier"},
                                SETENV: {token: "keyword", next: "@hasIdentifier"},
                                SUMMARY: {token: "keyword", next: "@summary"},
                                QUEUE_SYSTEM: {token: "keyword", next: "@queueSystem"},
                                QUEUE_OPTION: {token: "keyword", next: "@queueOption"},
                                FORWARD_MODEL: {token: "keyword", next: "@forwardModel"},
                                SIMULATION_JOB: {token: "keyword", next: "@forwardModel"},
                                "@default": {token: "keyword", next: "@afterKeyword"},
                            },
                        },
                        "@deprecated": "warn-token",
                        "@default": "invalid",
                    },
                },
            ],
            [/[\s]+/, "white"],
            [/@comment/, "comment"],
            [/.*/, "invalid"],
        ],

        whitespace: [
            [
                /[\s]+/,
                {
                    cases: {
                        "@eos": {token: "white", next: "@pop"},
                        "@default": "white",
                    },
                },
            ],
            [
                /@comment/,
                {
                    cases: {
                        "@eos": {token: "comment", next: "@pop"},
                        "@default": "comment",
                    },
                },
            ],
        ],

        numbers: [
            [
                /@num/,
                {
                    cases: {
                        "@eos": {token: "number", next: "@pop"},
                        "@default": "number",
                    },
                },
            ],
            [
                /@floatNum/,
                {
                    cases: {
                        "@eos": {token: "number", next: "@pop"},
                        "@default": "number",
                    },
                },
            ],
        ],

        booleans: [
            [
                /@booleans/,
                {
                    cases: {
                        "@eos": {token: "constant", next: "@pop"},
                        "@default": "constant",
                    },
                },
            ],
        ],

        paramOperator: [
            [
                /:/,
                {
                    cases: {
                        "@eos": {token: "operator", next: "@pop"},
                        "@default": "operator",
                    },
                },
            ],
        ],

        stringTypes: [
            [
                /@unquotedString/,
                {
                    cases: {
                        "@eos": {token: "string", next: "@pop"},
                        "@default": "string",
                    },
                },
            ],
            [
                /@reference/,
                {
                    cases: {
                        "@eos": {token: "identifier", next: "@pop"},
                        "@default": "identifier",
                    },
                },
            ],
            [
                /<\%s>/,
                {
                    cases: {
                        // eslint-disable-line no-useless-escape
                        "@eos": {token: "identifier", next: "@pop"},
                        "@default": "identifier",
                    },
                },
            ],
            [
                /@envVar/,
                {
                    cases: {
                        "@eos": {token: "identifier", next: "@pop"},
                        "@default": "identifier",
                    },
                },
            ],
        ],

        stringOperators: [
            [
                /\%[ds]/,
                {
                    cases: {
                        // eslint-disable-line no-useless-escape
                        "@eos": {token: "predefined", next: "@pop"},
                        "@default": "predefined",
                    },
                },
            ],
            [
                /\*/,
                {
                    cases: {
                        "@eos": {token: "operator", next: "@pop"},
                        "@default": "operator",
                    },
                },
            ],
        ],

        strings: [
            {include: "@stringTypes"},
            [/"([^"\\]|\\.)*$/, "invalid"], // non-teminated string
            [/"/, {token: "string", bracket: "@open", next: "@quotedString"}],
        ],

        quotedString: [
            {include: "stringOperators"},
            {include: "@stringTypes"},
            [
                /"/,
                {
                    cases: {
                        "@eos": {token: "string", bracket: "@close", next: "@popall"},
                        "@default": {token: "string", bracket: "@close", next: "@pop"},
                    },
                },
            ],
        ],

        /* Generic keywords */

        afterKeyword: [
            {include: "@whitespace"},
            {include: "@numbers"},
            {include: "@booleans"},
            {include: "@stringOperators"},
            {include: "@strings"},
            ["", "", "@pop"],
        ],

        /* Defined parameter types */

        hasIdentifier: [
            {include: "@whitespace"},
            [/\w+/, {token: "identifier", switchTo: "@afterKeyword"}],
            ["", "", "@pop"],
        ],

        hookWorkflow: [
            {include: "@whitespace"},
            [/\w+/, {token: "identifier", next: "@hookWorkflowPoint"}],
            ["", "", "@pop"],
        ],

        hookWorkflowPoint: [
            {include: "@whitespace"},
            [
                /[A-Z][_A-Z]+/,
                {
                    cases: {
                        "@workflowHookPoints": {token: "type", next: "@popall"},
                        "@default": {token: "invalid", next: "@popall"},
                    },
                },
            ],
            ["", "", "@popall"],
        ],

        summary: [
            {include: "@whitespace"},
            [
                /(@summaryVector)(\*?[:\*])/,
                {
                    cases: {
                        // eslint-disable-line no-useless-escape
                        "$1@summaryVectors": [
                            // Includes `FOPR*`, `FOPR:`, `FOPR*:`
                            "identifier",
                            {token: "delimiter", switchTo: "@afterKeyword"},
                        ],
                        "@default": ["identifier", {token: "delimiter", switchTo: "@afterKeyword"}],
                    },
                },
            ],
            [
                /@summaryVector/,
                {
                    cases: {
                        // Vectors alone, e.g. `FPR`
                        "@summaryVectors": {token: "identifier", switchTo: "@afterKeyword"},
                        "@default": {token: "identifier", switchTo: "@afterKeyword"},
                    },
                },
            ],
            ["", "", "@pop"],
        ],

        /* Parameter types */

        field: [{include: "@whitespace"}, [/\w+/, {token: "identifier", switchTo: "@fieldParams"}], ["", "", "@pop"]],
        fieldParams: [
            {include: "@whitespace"},
            {include: "@numbers"},
            {include: "@booleans"},
            [
                /@unquotedString/,
                {
                    cases: {
                        "@fieldParameters": {
                            cases: {
                                "@eos": {token: "identifier", next: "@pop"},
                                "@default": "identifier",
                            },
                        },
                        "@eos": {token: "string", next: "@pop"},
                        "@default": "string",
                    },
                },
            ],
            {include: "@paramOperator"},
            {include: "@stringOperators"},
            {include: "@strings"},
            ["", "", "@pop"],
        ],

        genData: [
            {include: "@whitespace"},
            [/\w+/, {token: "identifier", switchTo: "@genDataParams"}],
            ["", "", "@pop"],
        ],
        genDataParams: [
            {include: "@whitespace"},
            [
                /,/,
                {
                    cases: {
                        "@eos": {token: "invalid", next: "@pop"},
                        "@default": "delimiter",
                    },
                },
            ],
            [
                /\b\d+\b(?![a-zA-Z]+)/,
                {
                    cases: {
                        "@eos": {token: "number", next: "@pop"},
                        "@default": "number",
                    },
                },
            ],
            [
                /@unquotedString/,
                {
                    cases: {
                        "@genDataParameters": {
                            cases: {
                                "@eos": {token: "identifier", next: "@pop"},
                                "@default": "identifier",
                            },
                        },
                        ASCII: {
                            cases: {
                                "@eos": {token: "type", next: "@pop"},
                                "@default": "type",
                            },
                        },
                        "@eos": {token: "string", next: "@pop"},
                        "@default": "string",
                    },
                },
            ],
            {include: "@paramOperator"},
            {include: "@stringOperators"},
            {include: "@strings"},
            ["", "", "@pop"],
        ],

        surface: [
            {include: "@whitespace"},
            [/\w+/, {token: "identifier", switchTo: "@surfaceParams"}],
            ["", "", "@pop"],
        ],
        surfaceParams: [
            {include: "@whitespace"},
            {include: "@booleans"},
            [
                /@unquotedString/,
                {
                    cases: {
                        "@surfaceParameters": "identifier",
                        "@eos": {token: "string", next: "@pop"},
                        "@default": "string",
                    },
                },
            ],
            {include: "@paramOperator"},
            {include: "@stringOperators"},
            {include: "@strings"},
            ["", "", "@pop"],
        ],

        /* Forward models */

        forwardModel: [
            {include: "@whitespace"},
            [
                /(@fwdModelRegex)(\()/,
                [
                    // @ts-ignore
                    "function",
                    {
                        cases: {
                            "@eos": {token: "delimiter", bracket: "@open", next: "@pop"},
                            "@default": {token: "delimiter", bracket: "@open", switchTo: "@forwardModelParams"},
                        },
                    },
                ],
            ],
            [/@fwdModelRegex/, {token: "function", next: "@pop"}],
            ["", "", "@pop"],
        ],

        forwardModelParams: [
            {include: "@whitespace"},
            {include: "@stringOperators"},
            [
                /@unquotedString:/,
                {
                    cases: {
                        "@eos": {token: "string", next: "@pop"},
                        "@default": "string",
                    },
                },
            ],
            {include: "@strings"},
            [
                /=/,
                {
                    cases: {
                        "@eos": {token: "operator", next: "@pop"},
                        "@default": "operator",
                    },
                },
            ],
            [
                /,/,
                {
                    cases: {
                        "@eos": {token: "delimiter", next: "@pop"},
                        "@default": "delimiter",
                    },
                },
            ],
            [/\)/, {token: "delimiter", bracket: "@close", next: "@pop"}],
            ["", "", "@pop"],
        ],

        /* Queue settings */

        queueSystem: [
            {include: "@whitespace"},
            [
                /@unquotedString/,
                {
                    cases: {
                        "@queueTypes": {token: "identifier", next: "@pop"},
                        "@eos": {token: "string", next: "@pop"},
                        "@default": {token: "invalid", next: "@pop"},
                    },
                },
            ],
            ["", "", "@pop"],
        ],

        queueOption: [
            {include: "@whitespace"},
            [
                /@unquotedString/,
                {
                    cases: {
                        "@queueTypes": {
                            cases: {
                                LOCAL: {token: "identifier", next: "@pop"},
                                LSF: {token: "identifier", switchTo: "@lsfQueue"},
                                SLURM: {token: "identifier", switchTo: "@slurmQueue"},
                                TORQUE: {token: "identifier", switchTo: "@torqueQueue"},
                            },
                        },
                        "@eos": {token: "string", next: "@pop"},
                        "@default": {token: "invalid", next: "@pop"},
                    },
                },
            ],
            ["", "", "@pop"],
        ],

        lsfQueue: [
            {include: "@whitespace"},
            [
                /@unquotedString/,
                {
                    cases: {
                        "@lsfConfig": {token: "keyword", switchTo: "@afterKeyword"},
                        "@default": {token: "invalid", next: "@popall"},
                    },
                },
            ],
            ["", "", "@popall"],
        ],

        slurmQueue: [
            {include: "@whitespace"},
            [
                /@unquotedString/,
                {
                    cases: {
                        "@slurmConfig": {token: "keyword", switchTo: "@afterKeyword"},
                        "@default": {token: "invalid", next: "@popall"},
                    },
                },
            ],
            ["", "", "@popall"],
        ],

        torqueQueue: [
            {include: "@whitespace"},
            [
                /@unquotedString/,
                {
                    cases: {
                        "@torqueConfig": {token: "keyword", switchTo: "@afterKeyword"},
                        "@default": {token: "invalid", next: "@popall"},
                    },
                },
            ],
            ["", "", "@popall"],
        ],
    },
};
