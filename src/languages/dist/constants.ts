/* eslint-disable no-template-curly-in-string */
import {DistOptions} from "@languages/dist";

import {dedent} from "@utils/string";

import {IEvent, IMarkdownString, IRange, Position, editor, languages} from "monaco-editor";

export interface LanguageServiceDefaults {
    readonly onDidChange: IEvent<LanguageServiceDefaults>;
    readonly diagnosticsOptions: DistOptions;
    setDiagnosticsOptions: (options: DistOptions) => void;
}

export const languageId = "dist";

export namespace Regex {
    export const keyword = /^[a-zA-Z][_a-zA-Z0-9]+/;
    export const comment = /--.*$/;
    export const digits = /\d+(\d+)*/;
}

interface Keyword extends languages.CompletionItem {
    readonly detail: string;
    readonly documentation: string | IMarkdownString;
    readonly insertText: string;
    readonly insertTextRules?: languages.CompletionItemInsertTextRule;
    readonly kind: languages.CompletionItemKind;
    readonly label: string | languages.CompletionItemLabel;
    readonly numParams: number;
    readonly range: IRange | languages.CompletionItemRanges;
    // `usage` contains example usage that would follow the keyword (label)
    // e.g. label: 'NORMAL'
    //      usage: 'MEAN STDDEV'
    // Hover provider then joints them with a space
    readonly usage: string;
}

export interface IDistToken {
    readonly value: editor.IWordAtPosition;
    readonly position: Position;
    readonly token: string;
    readonly keyword?: Keyword;
}

export namespace Dist {
    export const keywords = <Keyword[]>[
        {
            label: "NORMAL",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A Gaussian prior",
            usage: "MEAN STDDEV",
            numParams: 2,
            documentation: <IMarkdownString>{
                value: dedent`
                Sets a normal (Gaussian) prior. \`NORMAL\` takes two arguments, a mean 
                value and a standard deviation. Thus, the following example will assign 
                a normal prior with mean 0 and standard deviation 1 to the variable 
                \`VAR\`.

                ### Example
                """
                    VAR NORMAL 0 1
                """
            `,
            },
            insertText: "NORMAL ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "LOGNORMAL",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A log normal prior",
            usage: "MEAN STDDEV",
            numParams: 2,
            documentation: <IMarkdownString>{
                value: dedent`
                A stochastic variable is log normally distributed if the logarithm of 
                the variable is normally distributed. In other words, if \`X\` is normally
                distributed, then \`Y = exp(X)\` is log normally distributed.

                A log normal prior is suited to model positive quantities with a heavy 
                tail (tendency to take large values). To set a log normal prior, use 
                the keyword \`LOGNORMAL\`. It takes two arguments, the mean and standard 
                deviation of the logarithm of the variable.

                ### Example
                """
                    VAR LOGNORMAL 0 1
                """
            `,
            },
            insertText: "LOGNORMAL ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "TRUNCATED_NORMAL",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A truncated normal (clamped) prior",
            usage: "MEAN STDDEV XMIN XMAX",
            numParams: 4,
            documentation: <IMarkdownString>{
                value: dedent`
                This TRUNCATED_NORMAL distribution works as follows:

                - Draw random variable \`X ~ N(μ, σ)\`
                - Clamp X to the interval [min, max]

                This is not a proper normal distribution; hence the clamping to 
                \`[min, max]\` should be an exceptional event. To configure this 
                distribution for a situation with mean 1, standard deviation 0.25 
                and hard limits 0 and 10:

                """
                    VAR TRUNCATED_NORMAL 1 0.25 0 10
                """
            `,
            },
            insertText: "TRUNCATED_NORMAL ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "UNIFORM",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A uniform prior",
            usage: "XMIN XMAX",
            numParams: 2,
            documentation: <IMarkdownString>{
                value: dedent`
                A stochastic variable is uniformly distributed if has a constant 
                probability density on a closed interval. Thus, the uniform distribution
                is completely characterized by it’s minimum and maximum value. To assign
                a uniform distribution to a variable, use the keyword \`UNIFORM\`, which 
                takes a minimum and a maximum value for a the variable. Here is an 
                example, which assigns a uniform distribution between 0 and 1 to a 
                variable \`VAR\`:

                ### Example
                """
                    VAR UNIFORM 0 1
                """

                It can be shown that among all distributions bounded below by a and above
                by b, the uniform distribution with parameters a and b has the maximal 
                entropy (contains the least information). Thus, the uniform distribution 
                should be your preferred prior distribution for robust modeling of 
                bounded variables.
            `,
            },
            insertText: "UNIFORM ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "LOGUNIF",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A log uniform prior",
            usage: "XMIN XMAX",
            numParams: 2,
            documentation: <IMarkdownString>{
                value: dedent`
                A stochastic variable is log uniformly distributed if its logarithm is
                uniformly distributed on the interval [a,b]. To assign a log uniform 
                distribution to a variable, use the keyword \`LOGUNIF\`, which takes a
                minimum and a maximum value for the output variable as arguments. 

                ### Example
                """
                    VAR LOGUNIF 0.00001 1
                """

                This will give values in the range \`[0.00001, 1]\` - with considerably 
                more weight towards the lower limit. The log uniform distribution is 
                useful when modeling a bounded positive variable who has most of its 
                probability weight towards one of the bounds.
            `,
            },
            insertText: "LOGUNIF ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "CONST",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A Dirac constant value prior",
            usage: "VALUE",
            numParams: 1,
            documentation: <IMarkdownString>{
                value: dedent`
                The keyword \`CONST\` is used to assign a Dirac distribution to a 
                variable, i.e. set it to a constant value.

                ### Example
                """
                    VAR CONST 1.0
                """
            `,
            },
            insertText: "CONST ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "DUNIF",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A discrete uniform prior",
            usage: "NBINS XMIN XMAX",
            numParams: 3,
            documentation: <IMarkdownString>{
                value: dedent`
                The keyword \`DUNIF\` is used to assign a discrete uniform distribution.
                It takes three arguments, the number of bins, a minimum and a maximum value.
                Here is an example which creates a discrete uniform distribution with 
                1, 2, 3, 4 and 5 as possible values:

                ### Example
                """
                    VAR7 DUNIF 5 1 5
                """

                Note that you can use the minimum and maximum to scale your distribution. 
                In particular this will give you values on the form
                """text
                    min + i*(max-min)/(nbins - 1)
                """
                for values of i between 0 and nbins-1.
            `,
            },
            insertText: "DUNIF ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "ERRF",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A prior resulting from an error function",
            usage: "MIN MAX SKEWNESS WIDTH",
            numParams: 4,
            documentation: <IMarkdownString>{
                value: dedent`
                The ERRF keyword is used to define a prior resulting
                from applying the error function to a normally distributed variable
                with mean 0 and variance 1. The keyword takes four arguments:

                ### Example
                """
                    VAR ERRF MIN MAX SKEWNESS WIDTH
                """

                The arguments \`MIN\` and \`MAX\` sets the minimum and maximum value of 
                the transform. Zero \`SKEWNESS\` results in a symmetric distribution, 
                whereas negative \`SKEWNESS\` will shift the distribution towards the left 
                and positive \`SKEWNESS\` will shift it towards the right. Letting \`WIDTH\` 
                be larger than one will cause the distribution to be unimodal, whereas
                \`WIDTH\` less than one will create a bi-modal distribution.
            `,
            },
            insertText: "ERRF ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "DERRF",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A discrete prior resulting from an error function",
            usage: "NBINS MIN MAX SKEWNESS WIDTH",
            numParams: 5,
            documentation: <IMarkdownString>{
                value: dedent`
                The DERRF keyword is used to define a discrete prior resulting
                from applying the error function to a normally distributed variable
                with mean 0 and variance 1. The keyword takes five arguments:

                ### Example
                """
                    VAR DERRF NBINS MIN MAX SKEWNESS WIDTH
                """

                \`NBINS\` set the number of discrete values, and the other arguments 
                have the same effect as in ERRF.

                The arguments \`MIN\` and \`MAX\` sets the minimum and maximum value of 
                the transform. Zero \`SKEWNESS\` results in a symmetric distribution, 
                whereas negative \`SKEWNESS\` will shift the distribution towards the left 
                and positive \`SKEWNESS\` will shift it towards the right. Letting \`WIDTH\` 
                be larger than one will cause the distribution to be unimodal, whereas
                \`WIDTH\` less than one will create a bi-modal distribution.
            `,
            },
            insertText: "DERRF ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
        {
            label: "TRIANGULAR",
            kind: languages.CompletionItemKind.Keyword,
            detail: "A triangular prior",
            usage: "XMIN XMODE XMAX",
            numParams: 3,
            documentation: <IMarkdownString>{
                value: dedent`
                Set a triangular prior distribution.

                ### Example
                """
                    VAR TRIANGULAR XMIN XMODE XMAX
                """

                Where \`XMODE\` correponds to the location of the maximum in the 
                distribution function.
            `,
            },
            insertText: "TRIANGULAR ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
        },
    ];
}
