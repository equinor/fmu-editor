/* eslint-disable no-template-curly-in-string */
import {IMarkdownString, IRange, languages} from "monaco-editor";

import {dedent} from "./utils";

export const languageId = "ert";

export namespace Regex {
    export const keyword = /^[A-Z][_A-Z0-9]+/;
     // eslint-disable-next-line no-useless-escape
    export const unquotedString = /[\wæøåÆØÅ\/\.\-]+/;
    export const reference = /<([a-zA-Z0-9_]+)>/;
    export const envVar = /\$[A-Z0-9_]+/;
    export const summaryVector = /[A-Zn1-9]{2,8}/;
    export const comment = /--.*$/;
    // Monarch can't do (?i) case insensitivity
    export const booleans = /([T|t]rue|TRUE|[F|f]alse|FALSE)/;
     // eslint-disable-next-line no-useless-escape
    export const floatNum = /[-]?\d*\.\d+([eE][\-+]?\d+)?(?!\.)/;
    export const num = /[-]?[\d]+(?=\s|$)/;
    export const forwardModel = /[A-Z][_A-Z0-9]+/;
}

interface KeywordParameter extends languages.CompletionItem {
    readonly required: boolean;
    readonly numerical: boolean;
    readonly takesFilepath: boolean;
    readonly delimiter?: string;
    readonly options?: string[];
}

interface Keyword extends languages.CompletionItem {
    readonly detail: string;
    readonly documentation: string | IMarkdownString;
    readonly insertText: string;
    readonly insertTextRules?: languages.CompletionItemInsertTextRule;
    readonly kind: languages.CompletionItemKind;
    readonly label: string | languages.CompletionItemLabel;
    readonly numerical: boolean;
    readonly parameters: KeywordParameter[];
    readonly range: IRange | languages.CompletionItemRanges;
    readonly required: boolean;
    readonly tags?: languages.CompletionItemTag[];
    readonly takesFilepath: boolean;
    // `usage` contains example usage that would follow the keyword (label)
    // e.g. label: 'RANDOM_SEED'
    //      usage: '123456'
    // Hover provider then joints them with a space
    readonly usage: string;
}

export namespace Ert {
    export const version = "4.3.1";

    export const booleans = [
        "FALSE", "False", "false",
        "TRUE", "True", "true",
    ];

    export const transformations = [
        { label: "EXP",  documentation: <IMarkdownString>{
            value: "Calculates `y = e^x`" }
        },
        { label: "EXP0", documentation: <IMarkdownString>{
            value: "Calculates `y = e^x - 0.000001`" }
        },
        { label: "LN",   documentation: <IMarkdownString>{
            value: "Calculates the *natural* logarithm `y = ln x`" }
        },
        { label: "LN0", documentation: <IMarkdownString>{
            value: "Calculates the *natural* logarithm `y = ln x + 0.000001" }
        },
        { label: "LOG", documentation: <IMarkdownString>{
            value: "Calculates the *natural* logarithm `y = ln x`" }
        },
        { label: "LOG10", documentation: <IMarkdownString>{
            value: "Calculates the *log10* logarithm `y = log10 x`" }
        },
        { label: "POW10", documentation: <IMarkdownString>{
            value: "Calculates the power `y = 10^x`" }
        },
        { label: "TRUNC_POW10", documentation: <IMarkdownString>{
            value: "Calculates the power `y = 10^x` and truncates low values at 0.001" }
        },
    ];

    export const keywords = <Keyword[]>[
        {
            label: "ANALYSIS_COPY",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Create new instance of analysis module",
            usage: "copyFrom copyTo",
            documentation: <IMarkdownString>{ value: dedent`
                With the \`ANALYSIS_COPY\` keyword you can create a new instance of a
                module. This can be convenient if you want to run the same algorithm
                with the different settings:

                """
                    ANALYSIS_COPY  A1  A2
                """

                We copy \`A1\` -> \`A2\`, where \`A1\` must be one of available
                analysis modules \`STD_ENKF\` and \`IES\`. After the copy operation
                the modules \`A1\` and \`A2\` are 100% identical. We then set the
                truncation to two different values:

                """
                    ANALYSIS_SET_VAR A1 ENKF_TRUNCATION 0.95
                    ANALYSIS_SET_VAR A2 ENKF_TRUNCATION 0.98
                """
            `},
            insertText: "ANALYSIS_COPY ${1:ORIG} ${2:COPY}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ANALYSIS_SELECT",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Select analysis module to use in update",
            usage: "ANAME",
            documentation: <IMarkdownString>{ value: dedent`
                This keyword is used to select which analysis module to actually use
                in the update.

                """
                    ANALYSIS_SELECT ANAME
                """
            `},
            insertText: "ANALYSIS_SELECT ${1:ANAME}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ANALYSIS_SET_VAR",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Set analysis module internal state variable",
            usage: "ANAME ENKF_TRUNCATION 0.97",
            documentation: <IMarkdownString>{ value: dedent`
                The analysis modules can have internal state, e.g. truncation cutoff
                values, these values can be manipulated from the config file using the
                \`ANALYSIS_SET_VAR\` keyword.

                """
                    ANALYSIS_SET_VAR  ANAME  ENKF_TRUNCATION  0.97
                """

                Here ANAME must be one of IES and STD_ENKF which are the two analysis
                modules currently available. To use this you must know which variables
                the module supports setting this way. If you try to set an unknown
                variable you will get an error message on stderr.
            `},
            insertText: "ANALYSIS_SET_VAR ${1:ANAME} ${2:ENKF_TRUNCATION} ${3:0.97}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "CASE_TABLE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Deprecated",
            usage: "Deprecated",
            documentation: "CASE_TABLE is deprecated.",
            insertText: "CASE_TABLE",
            parameters: [],
            tags: [ languages.CompletionItemTag.Deprecated ],
        },
        {
            label: "DATA_FILE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Provide an ECLIPSE data file",
            usage: "ECLIPSE.DATA",
            documentation: <IMarkdownString>{ value: dedent`
                Meant to be set to the filepath of an eclipse simulator input, when
                such a simulator is used. This does two things. First, the
                \`DATA_FILE\` will be templated, see \`RUN_TEMPLATE\`. Second, ERT
                will look for the \`PARALLEL\` keyword in this file in order to set
                \`NUM_CPU\`.

                The templated file will be named according to \`ECLBASE\` and copied
                to the runpath folder. Note that support for parsing the ECLIPSE data
                file is limited, and using explicit templating with \`RUN_TEMPLATE\`
                is recommended where possible.

                ### Example
                """
                    -- Load the data file called ECLIPSE.DATA
                    DATA_FILE ECLIPSE.DATA
                """

                See the \`DATA_KW\` keyword which can be used to utilize more template
                functionality in the eclipse datafile.

                This is used to replace ERT magic strings into the data file, as well
                as update the number of cpus that are reserved for ERT in the queue
                system.

                It searches for \`PARALLEL\` in the data file, and if that is not
                found it will search for \`SLAVE\` and update \`NUM_CPU\` according
                to how many nodes are found, note that it does not parse the data files
                of the nodes, and will assume one cpu per node where entry number 5 is
                not set, and the number of entry number 5 otherwise plus one cpu for
                the master node.

                It is strongly recommended to use the \`RUN_TEMPLATE\` for magic string
                replacement and resource allocation instead. Combined with \`NUM_CPU\`
                the resources for the cluster are specified directly in the ERT
                configuration, and can be templated into the ECLIPSE data file, see
                \`RUN_TEMPLATE\`.
            `},
            insertText: "DATA_FILE ${1:file}.DATA",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "DATA_KW",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Replace strings in ECLIPSE .DATA files",
            usage: "REPLACE_THIS with_this",
            documentation: <IMarkdownString>{ value: dedent`
                The \`DATA_KW\` keyword can be used for inserting strings into
                placeholders in the ECLIPSE data file. For instance, it can be used
                to insert include paths.

                ### Example
                """
                    -- Define the alias MY_PATH using DATA_KW.
                    -- Any instances of <MY_PATH> (yes, with brackets)
                    -- in the ECLIPSE data file will now be replaced
                    -- with /mnt/my_own_disk/my_reservoir_model
                    -- when running the ECLIPSE jobs.
                    DATA_KW  MY_PATH  /mnt/my_own_disk/my_reservoir_model
                """

                The \`DATA_KW\` keyword is of course optional. Note also that
                ERT has some built in magic strings.
            `},
            insertText: "DATA_KW ${1:REPLACE_THIS} ${2:with this}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "DEFINE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Define variables with config scope",
            usage: "<KEY> value",
            documentation: <IMarkdownString>{ value: dedent`
                With the \`DEFINE\` keyword you can define key-value pairs which will
                be substituted in the rest of the configuration file. The \`DEFINE\`
                keyword expects two arguments: a key and a value to replace for that
                key. Later instances of the key enclosed in \`<\` and \`>\` will be
                substituted with the value. The value can consist of several strings,
                in that case they will be joined by one single space.

                ### Example
                """
                    -- Define ECLIPSE_PATH and ECLIPSE_BASE
                    DEFINE  <ECLIPSE_PATH>  /path/to/eclipse/run
                    DEFINE  <ECLIPSE_BASE>  STATF02
                    DEFINE  <KEY>           VALUE1       VALUE2 VALUE3            VALUE4

                    -- Set the GRID in terms of the ECLIPSE_PATH
                    -- and ECLIPSE_BASE keys.
                    GRID    <ECLIPSE_PATH>/<ECLIPSE_BASE>.EGRID
                """

                The last key defined above (\`KEY\`) will be replaced with
                \`VALUE1 VALUE2 VALUE3 VALUE4\` - i.e. the extra spaces will be
                discarded.
            `},
            insertText: "DEFINE <${1:KEY}> ${2:value}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ECLBASE",
            kind: languages.CompletionItemKind.Keyword,
            required: true,
            numerical: false,
            takesFilepath: true,
            detail: "Basename for ECLIPSE simulation",
            usage: "eclipse/model/MY_VERY_OWN_OIL_FIELD-%d",
            documentation: <IMarkdownString>{ value: dedent`
                The \`ECLBASE\` keyword sets the basename for the ECLIPSE simulations
                which will be generated by ERT. It can (and should, for your
                convenience) contain a \`%d\` specifier, which will be replaced with the
                realization numbers when running ECLIPSE. Note that due to limitations
                in ECLIPSE, the \`ECLBASE\` string must be in strictly upper or lower
                case.

                ### Example
                """
                    -- Use eclipse/model/MY_VERY_OWN_OIL_FIELD-0 etc. as basename.
                    -- When ECLIPSE is running, the %d will be, replaced with
                    -- realization number, and directories ''eclipse/model''
                    -- will be generated by ERT if they do not already exist, giving:
                    --
                    -- eclipse/model/MY_VERY_OWN_OIL_FIELD-0
                    -- eclipse/model/MY_VERY_OWN_OIL_FIELD-1
                    -- eclipse/model/MY_VERY_OWN_OIL_FIELD-2
                    -- ...
                    -- and so on.

                    ECLBASE eclipse/model/MY_VERY_OWN_OIL_FIELD-%d
                """

                Note: \`JOBNAME\` can be used as an alternative to \`ECLBASE\`. Note
                that if both are supplied, \`ECLBASE\` will be ignored, and the value
                provided by \`JOBNAME\` will be used. If none are supplied, the default
                jobname \`JOB<IENS>\` is used.
            `},
            insertText: "ECLBASE ${1:eclipse/model/BASENAME}-%d",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ENKF_ALPHA",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Parameter controlling outlier behaviour in EnKF",
            usage: "3.00",
            documentation: <IMarkdownString>{ value: dedent`
                \`ENKF_ALPHA\` is the scaling factor used when detecting outliers.
                Increasing this factor means that more observations will potentially
                be included in the assimilation. The default value is 3.00.
            `},
            insertText: "ENKF_ALPHA ${1:3.00}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ENKF_FORCE_NCOMP",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Force a specific number of principal components",
            usage: "TRUE",
            documentation: <IMarkdownString>{ value: dedent`
                Bool specifying if we want to force the subspace dimension we want
                to use in the EnKF updating scheme (SVD-based) to a specific integer.
                This is an alternative to selecting the dimension using
                \`ENKF_TRUNCATION\`.

                ### Example
                """
                    -- Setting the the subspace dimension to 2
                    ENKF_FORCE_NCOMP     TRUE
                    ENKF_NCOMP              2
                """
            `},
            insertText: "ENKF_FORCE_NCOMP ${1:TRUE}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ENKF_NCOMP",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Number of forced principal components",
            usage: "2",
            documentation: <IMarkdownString>{ value: dedent`
                Integer specifying the subspace dimension. Requires that
                \`ENKF_FORCE_NCOMP\` is \`TRUE\`.
            `},
            insertText: "ENKF_NCOMP ${1:2}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ENKF_TRUNCATION",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Cutoff used on singular value spectrum",
            usage: "0.99",
            documentation: <IMarkdownString>{ value: dedent`
                Truncation factor for the SVD-based EnKF algorithm. In this algorithm,
                the forecasted data will be projected into a low dimensional subspace
                before assimilation. This can substantially improve on the results
                obtained with the EnKF, especially if the data ensemble matrix is
                highly collinear.

                The default value of \`ENKF_TRUNCATION\` is \`0.98\`. If ensemble
                collapse is a big problem, a smaller value should be used (e.g 0.90
                or smaller). However, this does not guarantee that the problem of
                ensemble collapse will disappear. Note that setting the truncation
                factor to \`1.00\`, will recover the Standard-EnKF algorithm if and
                only if the covariance matrix for the observation errors is
                proportional to the identity matrix.
            `},
            insertText: "ENKF_TRUNCATION ${1:0.99}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ENSPATH",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: true,
            detail: "Folder used for storage of simulation results",
            usage: "../output/storage/",
            documentation: <IMarkdownString>{ value: dedent`
                The \`ENSPATH\` should give the name of a folder that will be used for
                storage by ERT. Note that the contents of this folder is not intended
                for human inspection. By default, \`ENSPATH\` is set to \`storage\`.

                ### Example
                """
                    -- Use internal storage in /mnt/my_big_enkf_disk
                    ENSPATH /mnt/my_big_enkf_disk
                """
            `},
            insertText: "ENSPATH ${1:../output/storage/}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "FIELD",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: true,
            detail: "Adds grid parameters",
            usage: "ID PARAMETER <ECLIPSE_FILE> INIT_FILES:/path/%d MIN:X MAX:Y "
                    + "OUTPUT_TRANSFORM:FUNC INIT_TRANSFORM:FUNC FORWARD_INIT:True",
            documentation: <IMarkdownString>{ value: dedent`
                The \`FIELD\` keyword is used to parametrize quantities which have
                extent over the full grid. In order to use the \`FIELD\` keyword, the
                \`GRID\` keyword must be supplied.

                A parameter field (e.g. porosity or permeability or Gaussian Random
                Fields from APS) is defined as follows:

                """
                    FIELD  ID PARAMETER   <ECLIPSE_FILE>  INIT_FILES:/path/%d  MIN:X MAX:Y OUTPUT_TRANSFORM:FUNC INIT_TRANSFORM:FUNC  FORWARD_INIT:True
                """

                Here \`ID\` must be the same as the name of the parameter in the
                \`INIT_FILES\`. \`ECLIPSE_FILE\` is the name of the file ERT will
                export this field to when running simulations. Note that there
                should be an \`IMPORT\` statement in the ECLIPSE data file
                corresponding to the name given with ECLIPSE_FILE in case the field
                parameter is a field used in ECLIPSE data file like perm or poro.
                \`INIT_FILES\` is a filename (with an embedded \`%d\` if
                \`FORWARD_INIT\` is set to False) to load the initial field from.
                Can be RMS ROFF format, ECLIPSE restart format or ECLIPSE GRDECL format.

                See the
                [Field](https://fmu-docs.equinor.com/docs/ert/reference/configuration/keywords.html#field)
                documentation for full details.
            `, isTrusted: true},
            insertText: "FIELD ${1:paramId} PARAMETER ${2:gridFile.roff} " +
                "INIT_FILES:${3:/path/to/}${2:gridFile.roff} FORWARD_INIT:${4:True}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [
                {
                    label: "PARAMETER",
                    required: true,
                    numerical: false,
                    takesFilepath: true,
                    detail: "The type of field",
                    documentation: <IMarkdownString>{ value: dedent`
                        This is the type of field, but the only type. Hence it must
                        always be present.
                    `},
                },
                {
                    label: "INIT_FILES",
                    required: true,
                    numerical: false,
                    takesFilepath: true,
                    detail: "Filename of initial field",
                    documentation: <IMarkdownString>{ value: dedent`
                        \`INIT_FILES\` is a filename (with an embedded \`%d\` if
                        \`FORWARD_INIT\` is set to \`False\`) to load the initial field
                        from. Can be RMS ROFF format, ECLIPSE restart format or ECLIPSE
                        GRDECL format.
                    `},
                    delimiter: ":",
                },
                {
                    label: "FORWARD_INIT",
                    required: false,
                    numerical: false,
                    takesFilepath: false,
                    detail: "True if relies on forward model",
                    documentation: <IMarkdownString>{ value: dedent`
                        True means that the files specified in the \`INIT_FILES\` are
                        expected to be created by a forward model, and does not need
                        any embedded \`%d\`. \`FORWARD_INIT:False\` means that the
                        files must have been created before running ERT and need
                        an embedded \`%d\`.
                    `},
                    delimiter: ":",
                    options: booleans,
                },
                {
                    label: "MIN",
                    required: false,
                    numerical: true,
                    takesFilepath: false,
                    detail: "Minimum value",
                    documentation: "The minimum value of the specified parameter.",
                    delimiter: ":",
                },
                {
                    label: "MAX",
                    required: false,
                    numerical: true,
                    takesFilepath: false,
                    detail: "Maximum value",
                    documentation: "The maximum value of the specified parameter.",
                    delimiter: ":",
                },
                {
                    label: "INIT_TRANSFORM",
                    required: false,
                    numerical: false,
                    takesFilepath: false,
                    detail: "Transformation applied when loaded",
                    documentation: <IMarkdownString>{ value: dedent`
                        Variables in ERT should be normally distributed internally for
                        assisted history matching. \`INIT_TRANSFORM\` is used to
                        transform the user input of parameter distribution when the
                        field is loaded into ERT.
                    `},
                    delimiter: ":",
                    options: transformations,
                },
                {
                    label: "OUTPUT_TRANSFORM",
                    required: false,
                    numerical: false,
                    takesFilepath: false,
                    detail: "Transformation applied when exported",
                    documentation: <IMarkdownString>{ value: dedent`
                        Variables in ERT should be normally distributed internally for
                        assisted history matching. \`OUTPUT_TRANSFORM\` is used to
                        transform the user input of parameter distribution when the
                        field is exported from ERT.
                    `},
                    delimiter: ":",
                    options: transformations,
                },
            ],
        },
        {
            label: "FORWARD_MODEL",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Add a forward model job",
            usage: "ECLIPSE100(<VERSION>=2021.1)",
            documentation: <IMarkdownString>{ value: dedent`
                The \`FORWARD_MODEL\` keyword is used to define how the simulations
                are executed, e.g., which version of ECLIPSE or RMS to use. Jobs that
                are to be used in the \`FORWARD_MODEL\` keyword must be defined using
                the \`INSTALL_JOB\` keyword. A set of default jobs is available, and
                by default \`FORWARD_MODEL\` takes the value \`ECLIPSE100\`.

                The \`FORWARD_MODEL\` keyword expects one keyword defined with
                \`INSTALL_JOB\`.

                ### Example
                """
                    -- Suppose that "MY_RELPERM_SCRIPT" has been defined with
                    -- the INSTALL_JOB keyword. This FORWARD_MODEL will execute
                    -- "MY_RELPERM_SCRIPT" before ECLIPSE100.
                    FORWARD_MODEL MY_RELPERM_SCRIPT
                    FORWARD_MODEL ECLIPSE100
                """
            `},
            insertText: "FORWARD_MODEL ${1:JOB}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "GEN_DATA",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Specify a data type updated by a forward model",
            usage: "R_A2_SIM RESULT_FILE:RFT_R_A2_%d INPUT_FORMAT:ASCII REPORT_STEPS:1",
            documentation: <IMarkdownString>{ value: dedent`
                The \`GEN_DATA\` keyword is used to load text files which have been
                generated by the forward model.

                The \`GEN_DATA\` keyword has several options, each of them required:

                - **RESULT_FILE**: This is the name of the file generated by the
                  forward model and read by ERT. This filename _must_ have a \`%d\`
                  as part of the name. That \`%d\` will be replaced by report step
                  when loading.
                - **INPUT_FORMAT**: The format of the file written by the forward
                  model (i.e. \`RESULT_FILE\`) and read by ERT. The only valid value
                  is ASCII.
                - **REPORT_STEPS**: A list of the report step(s) where you expect the
                  forward model to create a result file. I.e., if the forward model
                  should create a result file for report steps 50 and 100 this setting
                  should be \`REPORT_STEPS:50,100\`. If you have observations of this
                  \`GEN_DATA\` data the RESTART setting of the corresponding
                  \`GENERAL_OBSERVATION\` must match one of the values given by
                  REPORT_STEPS.

                ### Example
                """
                    GEN_DATA 4DWOC  INPUT_FORMAT:ASCII   RESULT_FILE:SimulatedWOC%d.txt   REPORT_STEPS:10,100
                """

                See the
                [GEN_DATA](https://fmu-docs.equinor.com/docs/ert/reference/configuration/keywords.html#gen-data)
                documentation for full details.
            `, isTrusted: true},
            insertText: "GEN_DATA ${1:NAME} INPUT_FORMAT:ASCII " +
                "RESULT_FILE:${2:share/results/tables/output}_%d REPORT_STEPS:${3:1}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [
                {
                    label: "INPUT_FORMAT",
                    required: true,
                    numerical: false,
                    takesFilepath: false,
                    detail: "Only ASCII is valid",
                    documentation: <IMarkdownString>{ value: dedent`
                        The format of the input file. Only valid when set to ASCII.
                    `},
                    delimiter: ":",
                },
                {
                    label: "RESULT_FILE",
                    required: true,
                    numerical: false,
                    takesFilepath: true,
                    detail: "Pathname to result file",
                    documentation: <IMarkdownString>{ value: dedent`
                        The name of the file generated by the forward model and read
                        by ERT. Must have a \`%d\` appended.
                    `},
                    delimiter: ":",
                },
                {
                    label: "REPORT_STEPS",
                    required: false,
                    numerical: false,
                    takesFilepath: false,
                    detail: "A list of report steps",
                    documentation: <IMarkdownString>{ value: dedent`
                        If the forward model should create a result file for report
                        steps 50 and 100, this should be set to
                        \`REPORT_STEPS:50,100\`.
                    `},
                    delimiter: ":",
                },
            ],
        },
        {
            label: "GEN_KW",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Add a scalar parameter",
            usage: "ID templates/template.txt include.txt priors.txt",
            documentation: <IMarkdownString>{ value: dedent`
                The General Keyword, or \`GEN_KW\` is meant used for specifying a
                limited number of parameters.

                ### Example
                """
                    GEN_KW  ID  templates/template.txt  include.txt  priors.txt
                """

                Where \`ID\` is an arbitrary unique identifier,
                \`templates/template.txt\` is the name of a template file,
                \`include.txt\` is the name of the file created for each realization
                based on the template file, and \`priors.txt\` is a file containing
                a list of parametrized keywords and a prior distribution for each.

                See the
                [GEN_KW](https://fmu-docs.equinor.com/docs/ert/reference/configuration/keywords.html#gen-kw)
                documentation for full details.
            `, isTrusted: true},
            insertText: "GEN_KW ${1:ID} ${2:../input/templates/.dummy.tmpl} " +
                "${3:.dummy.yml} ${4:../input/distributions/multregt.dist}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "GEN_KW_TAG_FORMAT",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Format used to add GEN_KW keys in templates",
            usage: "<%s>",
            documentation: <IMarkdownString>{ value: dedent`
                The format \`GEN_KW\` looks for in template files when doing
                replacements. Defaults to \`<%s>\`.
            `},
            insertText: "GEN_KW_TAG_FORMAT ${1:<%s>}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "GRID",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Provide an ECLIPSE grid to the reservoir model",
            usage: "MY_GRID.EGRID",
            documentation: <IMarkdownString>{ value: dedent`
                This is the name of an existing GRID/EGRID file for
                your ECLIPSE model. It is used to enable parametrization via the
                \`FIELD\` keyword. If you had to create a new grid file when preparing
                your ECLIPSE reservoir model for use with ERT, this should point
                to the new .EGRID file. The main use of the grid is to map out
                active and inactive cells when using \`FIELD\` data and define the
                dimension of the property parameter files in the \`FIELD\` keyword.
                The grid argument will only be used by the main ERT application
                and not passed down to the forward model in any way.

                ### Example
                """
                    -- Load the .EGRID file called MY_GRID.EGRID
                    GRID MY_GRID.EGRID
                """

                See the
                [GRID](https://fmu-docs.equinor.com/docs/ert/reference/configuration/keywords.html#grid)
                documentation for full details.
            `, isTrusted: true},
            insertText: "GRID ${1:../../rms/output/aps/ERTBOX.EGRID}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "HISTORY_SOURCE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Source used for historical values",
            usage: "REFCASE_HISTORY",
            documentation: <IMarkdownString>{ value: dedent`
                In the observation configuration file you can enter
                observations with the keyword \`HISTORY_OBSERVATION\`; this means
                that ERT will extract observed values from the model historical
                summary vectors of the reference case. What source to use for the
                historical values can be controlled with the \`HISTORY_SOURCE\`
                keyword. The different possible values for the \`HISTORY_SOURCE\`
                keyword are \`REFCASE_HISTORY\` and \`REFCASE_SIMULATED\`.

                ### Example
                """
                    -- Use historic data from reference case
                    HISTORY_SOURCE  REFCASE_HISTORY
                    REFCASE         /somefolder/ECLIPSE.DATA
                """

                ## REFCASE_HISTORY

                This is the default value for \`HISTORY_SOURCE\`, ERT will fetch the
                historical values from the xxxH keywords in the refcase summary,
                e.g. observations of \`WGOR:OP_1\` is based the \`WGORH:OP_1\`
                vector from the refcase summary.

                ## REFCASE_SIMULATED

                In this case the historical values are based on the simulated values
                from the refcase, this is mostly relevant when you want compare with
                another case which serves as 'the truth'.

                When setting \`HISTORY_SOURCE\` to either \`REFCASE_SIMULATED\` or
                \`REFCASE_HISTORY\` you must also set the \`REFCASE\` variable to
                point to the ECLIPSE data file in an existing reference case (should
                be created with the same schedule file as you are using now).
            `},
            insertText: "HISTORY_SOURCE REFCASE_${1:HISTORY}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "HOOK_WORKFLOW",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Install a workflow to be run automatically",
            usage: "initWFLOW PRE_SIMULATION",
            documentation: <IMarkdownString>{ value: dedent`
                With the keyword \`HOOK_WORKFLOW\` you can configure
                workflow "hooks"; meaning workflows which will be run
                automatically at certain points during ERT's execution. Currently
                there are five points in ERTs flow of execution where you can hook
                in a workflow:

                - \`PRE_SIMULATION\`: before the simulations
                - \`POST_SIMULATION\`: after the simulations
                - \`PRE_UPDATE\`: before the update step
                - \`POST_UPDATE\`: after the update step
                - \`PRE_FIRST_UPDATE\`: before the first update

                For non interactive algorithms, \`PRE_FIRST_UPDATE\` is
                equal to \`PRE_UPDATE\`. The \`POST_SIMULATION\` hook is typically
                used to trigger QC workflows.

                """
                    HOOK_WORKFLOW initWFLOW        PRE_SIMULATION
                    HOOK_WORKFLOW preUpdateWFLOW   PRE_UPDATE
                    HOOK_WORKFLOW postUpdateWFLOW  POST_UPDATE
                    HOOK_WORKFLOW QC_WFLOW1        POST_SIMULATION
                    HOOK_WORKFLOW QC_WFLOW2        POST_SIMULATION
                """

                In this example the workflow \`initWFLOW\` will run after all the
                simulation directories have been created, just before the forward
                model is submitted to the queue. The workflow \`preUpdateWFLOW\` will
                be run before the update step and \`postUpdateWFLOW\` will be run after
                the update step. When all the simulations have completed the two
                workflows \`QC_WFLOW1\` and \`QC_WFLOW2\` will be run.

                Observe that the workflows being 'hooked in' with the
                \`HOOK_WORKFLOW\` must be loaded with the \`LOAD_WORKFLOW\` keyword.
            `},
            insertText: "HOOK_WORKFLOW ${1:workflowName} ${2:PRE_SIMULATION}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "INCLUDE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Include another ERT configuration file",
            usage: "../input/config/install_custom_jobs.ert",
            documentation: <IMarkdownString>{ value: dedent`
                ### Example
                """
                    -- Include another ERT configuration here
                    INCLUDE ../input/config/install_custom_jobs.ert
                """
            `},
            insertText: "INCLUDE ${1:../input/config/install_custom_jobs.ert}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "INSTALL_JOB",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Install a job for use in a forward model",
            usage: "LOMELAND jobs/lomeland.txt",
            documentation: <IMarkdownString>{ value: dedent`
                The \`INSTALL_JOB\` keyword is used to instruct ERT how to
                run external applications and scripts, i.e. defining a job. After
                a job has been defined with \`INSTALL_JOB\`, it can be used with the
                \`FORWARD_MODEL\` keyword. For example, if you have a script which
                generates relative permeability curves from a set of parameters,
                it can be added as a job, allowing you to do history matching and
                sensitivity analysis on the parameters defining the relative
                permeability curves.

                The \`INSTALL_JOB\` keyword takes two arguments, a job name and the
                name of a configuration file for that particular job.

                ### Example
                """
                    -- Define a Lomeland relative permeabilty job.
                    -- The file jobs/lomeland.txt contains a detailed
                    -- specification of the job.
                    INSTALL_JOB LOMELAND jobs/lomeland.txt
                """

                The configuration file used to specify an external job is easy to use
                and very flexible. It is documented in Customizing the simulation
                workflow in ERT.
            `},
            insertText: "INSTALL_JOB ${1:JOBNAME} ${2:../bin/jobs}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ITER_CASE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Case name format",
            usage: "default_%d",
            documentation: <IMarkdownString>{ value: dedent`
                For the iterated ensemble smoother. By default, this value is set to
                \`default_$d\`.
            `},
            insertText: "ITER_CASE ${1:default_%d}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ITER_COUNT",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Number of iterations",
            usage: "4",
            documentation: <IMarkdownString>{ value: dedent`
                For the iterated ensemble smoother. By default, this value is set to 4.
            `},
            insertText: "ITER_COUNT ${1:4}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "ITER_RETRY_COUNT",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Number of retries for an iteration",
            usage: "4",
            documentation: <IMarkdownString>{ value: dedent`
                For the iterated ensemble smoother. By default, this value is set to 4.
            `},
            insertText: "ITER_RETRY_COUNT ${1:4}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "JOBNAME",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "An alternative to ECLBASE",
            usage: "JOB<IENS>",
            documentation: <IMarkdownString>{ value: dedent`
                As an alternative to the \`ECLBASE\` keyword you can use
                the \`JOBNAME\` keyword; in particular in cases where your forward model
                does not include ECLIPSE at all that makes more sense. If JOBNAME is
                used instead of ECLBASE the same rules of no-mixed-case apply. Defaults
                to \`JOB<IENS>\`.
            `},
            insertText: "JOBNAME ${1:JOB<IENS>}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "JOB_SCRIPT",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Python script managing the forward model",
            usage: "../bin/job.py",
            documentation: <IMarkdownString>{ value: dedent`
                Running the forward model from ERT is a multi-level process which can
                be summarized as follows:

                1. A Python module called jobs.py is written and stored in the
                   directory where the forward simulation is run. The jobs.py
                   module contains a list of job-elements, where each element
                   is a Python representation of the code entered when installing
                   the job.
                2. ERT submits a Python script to the EnKF queue system. This script
                   then loads the jobs.py module to find out which programs to run,
                   and how to run them.
                3. The job_script starts and monitors the individual jobs in the
                   jobs.py module.

                The \`JOB_SCRIPT\` keyword should point at the Python script which
                is managing the forward model. This should normally be set in the
                site wide configuration file.
            `},
            insertText: "JOB_SCRIPT ${1:../bin/job.py}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "LOAD_WORKFLOW",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Load a workflow into ERT",
            usage: "/path/to/workflow/WFLOW1",
            documentation: <IMarkdownString>{ value: dedent`
                Workflows are loaded with the configuration option \`LOAD_WORKFLOW\`:

                ### Example
                """
                    LOAD_WORKFLOW  /path/to/workflow/WFLOW1
                    LOAD_WORKFLOW  /path/to/workflow/workflow2  WFLOW2
                """

                The \`LOAD_WORKFLOW\` takes the path to a workflow file as the first
                argument. By default the workflow will be labeled with the filename
                internally in ERT, but you can optionally supply a second extra
                argument which will be used as the name for the workflow.
                Alternatively, you can load a workflow interactively.
            `},
            insertText: "LOAD_WORKFLOW ${1:../../bin/workflows/}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "LOAD_WORKFLOW_JOB",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Load a workflow job into ERT",
            usage: "jobConfigFile JobName",
            documentation: <IMarkdownString>{ value: dedent`
                Before the jobs can be used in workflows they must be loaded into ERT.
                This can be done either by specifying jobs by name, or by specifying a
                directory containing jobs.

                Use the keyword \`LOAD_WORKFLOW_JOB\` to specify jobs by name:

                """
                    LOAD_WORKFLOW_JOB jobConfigFile JobName
                """

                The \`LOAD_WORKFLOW_JOB\` keyword will load one workflow job. The name
                of the job is optional and will be fetched from the configuration file
                if not provided.
            `},
            insertText: "LOAD_WORKFLOW_JOB ${1:../../bin/jobs/}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "LICENSE_PATH",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Path to environment or application licenses",
            usage: "/path/to/licenses",
            documentation: <IMarkdownString>{ value: dedent`
                A path where ert-licenses to e.g. RMS are stored.
            `},
            insertText: "LICENSE_PATH ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
            parameters: [],
        },
        {
            label: "MAX_RUNTIME",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Maximum realization runtime in seconds",
            usage: "18000",
            documentation: <IMarkdownString>{ value: dedent`
                The \`MAX_RUNTIME\` keyword is used to control the runtime of simulations.
                When \`MAX_RUNTIME\` is set, a job is only allowed to run for MAX_RUNTIME,
                given in seconds. A value of 0 means unlimited runtime.

                ### Example
                """
                    -- Let each realizations run for 50 seconds
                    MAX_RUNTIME 50
                """
            `},
            insertText: "MAX_RUNTIME ${1:18000}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "MAX_SUBMIT",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Number of queue system retries",
            usage: "2",
            documentation: <IMarkdownString>{ value: dedent`
                The number of times the queue system should retry a simulation.
                Default is 2.
            `},
            insertText: "MAX_SUBMIT ${1:2}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "MIN_REALIZATIONS",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Minimum successful realizations to continue",
            usage: "20",
            documentation: <IMarkdownString>{ value: dedent`
                \`MIN_REALIZATIONS\` is the minimum number of realizations that
                must have succeeded for the simulation to be regarded as a success.

                \`MIN_REALIZATIONS\` can also be used in combination with
                \`STOP_LONG_RUNNING\`, see the documentation for \`STOP_LONG_RUNNING\`
                for a description of this.

                ### Example
                """
                    MIN_REALIZATIONS 20
                """

                The \`MIN_REALIZATIONS\` key can also be set as a percentage of
                \`NUM_REALIZATIONS\`.

                ### Example
                """
                    MIN_REALIZATIONS 10%
                """

                The MIN_REALIZATIONS key is optional, but if it has not been set all
                the realisations must succeed.

                Please note that \`MIN_REALIZATIONS 0\` means all simulations must
                succeed (this happens to be the default value). Note
                \`MIN_REALIZATIONS\` is rounded up e.g. 2% of 20 realizations is
                rounded to 1.
            `},
            insertText: "MIN_REALIZATIONS ${1:1}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "NUM_CPU",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Set the number of CPUs",
            usage: "2",
            documentation: <IMarkdownString>{ value: dedent`
                Equates to the \`-n\` argument in the context of LSF. For TORQUE, it is
                simply a upper bound for the product of nodes and CPUs per node.

                ### Example
                """
                    NUM_CPU 2
                """
            `},
            insertText: "NUM_CPU ${1:2}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "NUM_REALIZATIONS",
            kind: languages.CompletionItemKind.Keyword,
            required: true,
            numerical: true,
            takesFilepath: false,
            detail: "Set the number of realizations",
            usage: "100",
            documentation: <IMarkdownString>{ value: dedent`
                This is the size of the ensemble, i.e. the number of
                realizations/members in the ensemble.

                All configs must contain this keyword.

                ### Example
                """
                    -- Use 200 realizations/members
                    NUM_REALIZATIONS 200
                """
            `},
            insertText: "NUM_REALIZATIONS ${1:100}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "OBS_CONFIG",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "File specifying observations with uncertainties",
            usage: "my_observations.txt",
            documentation: <IMarkdownString>{ value: dedent`
                The OBS_CONFIG key should point to a file defining observations and
                associated uncertainties. The file should be in plain text and
                formatted according to the guidelines given in creating an observation
                file for use with ERT.

                ### Example
                """
                    -- Use the observations in my_observations.txt
                    OBS_CONFIG my_observations.txt
                """

                If you include \`HISTORY_OBSERVATION\` in the observation file, you
                must provide a reference Eclipse case through the \`REFCASE\` keyword.

                The \`OBS_CONFIG\` keyword is optional, but for your own convenience,
                it is strongly recommended to provide an observation file.
            `},
            insertText: "OBS_CONFIG ${1:../input/observations/}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "RANDOM_SEED",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: true,
            takesFilepath: false,
            detail: "Specify a random seed for ERT for reproducibility",
            usage: "123456",
            documentation: <IMarkdownString>{ value: dedent`
                Provides a random seed to ERT with which random sampling is based upon.

                ### Example
                """
                    RANDOM_SEED 123456
                """
            `},
            insertText: "RANDOM_SEED ${1:123456}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "QUEUE_OPTION",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Set options for a queue system",
            usage: "LSF LSF_SERVER be-grid01",
            documentation: <IMarkdownString>{ value: dedent`
                The chosen queue system can be configured further to for instance
                define the resources it is using. The different queues have individual
                options that are configurable.

                ### Example
                """
                    QUEUE_OPTION LSF  LSF_SERVER be-grid01
                    QUEUE_OPTION LSF  BJOBS_CMD  /path/to/my/bjobs
                    QUEUE_OPTION LSF  BSUB_CMD   /path/to/my/bsub
                """

                There are four queue systems and each has their own options. See the
                [QUEUE_OPTION](https://fmu-docs.equinor.com/docs/ert/reference/configuration/keywords.html#queue-option)
                documentation for full details.
            `},
            insertText: "QUEUE_OPTION ",
            insertTextRules: languages.CompletionItemInsertTextRule.KeepWhitespace,
            parameters: [],
        },
        {
            label: "QUEUE_SYSTEM",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "System used for running simulation jobs",
            usage: "LSF",
            documentation: <IMarkdownString>{ value: dedent`
                The keyword \`QUEUE_SYSTEM\` can be used to control where the
                simulation jobs are executed. It can take the values:
                - \`LSF\`
                - \`TORQUE\`
                - \`SLURM\`
                - \`LOCAL\`.

                ### Example
                """
                    -- Tell ERT to use the LSF cluster.
                    QUEUE_SYSTEM LSF
                """

                The \`QUEUE_SYSTEM\` keyword is optional, and usually defaults to
                \`LSF\` (this is site dependent).
            `},
            insertText: "QUEUE_SYSTEM ${1:LSF}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "REFCASE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Reference case used for observations and plotting",
            usage: "../input/refcase/FIELD.DATA",
            documentation: <IMarkdownString>{ value: dedent`
                The \`REFCASE\` key is used to provide ERT an existing ECLIPSE
                simulation from which it can read various information at startup.
                The intention is to ease the configuration needs for the user.
                Functionality provided with the refcase:

                - Summary keys are read from the refcase to enable use of wildcards.
                - Extract observed values from the refcase using the
                  \`HISTORY_OBSERVATION\` and \`HISTORY_SOURCE\` keys.

                The \`REFCASE\` keyword should point to an existing ECLIPSE simulation;
                ERT will then look up and load the corresponding summary results.

                ### Example
                """
                    -- The REFCASE keyword points to the datafile
                    -- of an existing ECLIPSE simulation.
                    REFCASE /path/to/somewhere/SIM_01_BASE.DATA
                """

                Please note that the refcase is a common source of frustration for ERT
                users. The reason is that ERT indexes summary observation values
                according to the report stepping of the reservoir simulator. This
                indexing is extracted by the report steps of the refcase when starting
                ERT. Later on, when extracting results from forecasted simulations,
                ERT requires that the indexing is according to that of the refcase.
                During a project it is very easy to introduce inconsistencies between
                the indexing in the refcase, the forward model and the internalized
                summary results in storage. Unfortunately, ERT does not handle this
                well and leaves the user with cryptical error messages.

                For the time being, it is hence necessary to keep the reporting as
                defined in the SCHEDULE section of the refcase and the model used
                in the project identical.

                The \`HISTORY_SOURCE\` keyword is optional. But if you are to perform
                model updating, indexing of summary observations need to be defined.
                This is either done by the \`REFCASE\` or the \`TIME_MAP\` keyword,
                and the former is recommended.
            `},
            insertText: "REFCASE ${1:../input/refcase/}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "RESULT_PATH",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Define where ERT should store results",
            usage: "results/step_%d",
            documentation: <IMarkdownString>{ value: dedent`
                ERT will print some simple tabulated results at each report step. The
                \`RESULT_PATH\` keyword should point to a folder where the tabulated
                results are to be written. It can contain a \`%d\` specifier, which will
                be replaced with the report step. The default value for \`RESULT_PATH\`
                is \`results/step_%d\`.

                ### Example
                """
                    -- Changing RESULT_PATH
                    RESULT_PATH my_nice_results/step-%d
                """
            `},
            insertText: "RESULT_PATH ${1:results/step_%d}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "RUNPATH",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Directory to run simulations in",
            usage: "<SCRATCH>/<USER>/<CASE_DIR>/realization-%d/iter-%d/",
            documentation: <IMarkdownString>{ value: dedent`
                The \`RUNPATH\` keyword should give the name of the folders where the
                ECLIPSE simulations are executed. It should contain \`<IENS>\` and
                \`<ITER>\`, which will be replaced by the realization number and
                iteration number when ERT creates the folders. By default, \`RUNPATH\`
                is set to \`simulations/realization-<IENS>/iter-<ITER>\`.

                ### Example
                """
                    -- Using <IENS> & <ITER> specifiers for RUNPATH.
                    RUNPATH /mnt/my_scratch_disk/realization-<IENS>/iter-<ITER>
                """

                ### Example deprecated syntax:
                """
                    -- Using RUNPATH with two %d specifers.
                    RUNPATH /mnt/my_scratch_disk/realization-%d/iteration-%d
                """

                Deprecated syntax still allow use of two \`%d\` specifers. Use of less
                than two \`%d\` is prohibited. The behaviour is identical to the default
                substitution.
            `},
            insertText: "RUNPATH ${1:<SCRATCH>/<USER>/<CASE_DIR>/realization-%d/iter-%d/}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "RUNPATH_FILE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Filepath containing path for all forward models",
            usage: ".ert_runpath_list",
            documentation: <IMarkdownString>{ value: dedent`
                When running workflows based on external scripts it is necessary to
                tell the external script in some way or another were all the
                realizations are located in the filesystem. Since the number of
                realisations can be quite high this will easily overflow the
                commandline buffer; the solution which is used is therefore to
                let ERT write a regular file which looks like this:

                """text
                    0   /path/to/realization-0   CASE0   iter
                    1   /path/to/realization-1   CASE1   iter
                    ...
                    N   /path/to/realization-N   CASEN   iter
                """

                The path to this file can then be passed to the scripts using the
                magic string \`<RUNPATH_FILE>\`. The \`RUNPATH_FILE\` will by default
                be stored as \`.ert_runpath_list\` in the same directory as the
                configuration file, but you can set it to something else with the
                \`RUNPATH_FILE\` key.
            `},
            insertText: "RUNPATH_FILE ${1:.ert_runpath_list}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "RUN_TEMPLATE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Install arbitrary files in the runpath directory",
            usage: "<TEMPLATE_DATA_FILE>  <ECLBASE>.DATA",
            documentation: <IMarkdownString>{ value: dedent`
                \`RUN_TEMPLATE\` can be used to copy files to the run path while
                doing magic string replacement in the file content and the file name.

                ### Example
                """
                    RUN_TEMPLATE my_text_file_template.txt my_text_file.txt
                """

                This will copy \`my_text_file_template\` into the run path, and perform
                magic string replacements in the file. If no magic strings are present,
                the file will be copied as it is.

                It is also possible to perform replacements in target file names:

                """
                    DEFINE <MY_FILE_NAME> result.txt
                    RUN_TEMPLATE template.tmpl <MY_FILE_NAME>
                """

                If one would like to do substitutions in the ECLIPSE data file, that
                can be done like this:

                """
                    ECLBASE BASE_ECL_NAME%d
                    RUN_TEMPLATE MY_DATA_FILE.DATA <ECLBASE>.DATA
                """

                This will copy \`MY_DATA_FILE.DATA\` into the run path and name it
                \`BASE_ECL_NAME0.DATA\` while doing magic string replacement in the
                contents.

                If you would like to substitute in the realization number as a part
                of \`ECLBASE\` using \`<IENS>\` instead of \`%d\` is a better option:

                """
                    ECLBASE BASE_ECL_NAME-<IENS>
                    RUN_TEMPLATE MY_DATA_FILE.DATA <ECLBASE>.DATA
                """

                To control the number of CPUs that are reserved for ECLIPSE use
                \`RUN_TEMPLATE\` with NUM_CPU and keep them in sync:

                """
                    NUM_CPU 4
                    ECLBASE BASE_ECL_NAME-<IENS>
                    RUN_TEMPLATE MY_DATA_FILE.DATA <ECLBASE>.DATA
                """

                In the ECLIPSE data file:

                \`PARALLEL <NUM_CPU>\`
            `},
            insertText: "RUN_TEMPLATE ${1:../../eclipse/model/MODEL.DATA} ${2:<ECLBASE>.DATA}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "SETENV",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Set Unix environment variable",
            usage: "VAR value",
            documentation: <IMarkdownString>{ value: dedent`
                You can use the \`SETENV\` keyword to alter the Unix environment
                where ERT runs forward models.

                ### Example
                """
                    -- Set up environment
                    SETENV  MY_VAR          World
                    SETENV  MY_OTHER_VAR    Hello$MY_VAR
                """

                This will result in two environment variables being set in the compute
                side and available to all jobs. \`MY_VAR\` will be "World", and
                \`MY_OTHER_VAR\` will be "HelloWorld". The variables are expanded in
                order on the compute side, so the environment where ERT is running
                has no impact, and is not changed.
            `},
            insertText: "SETENV ${1:VAR} ${2:value}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "SIMULATION_JOB",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Experimental alternative to FORWARD_MODEL",
            usage: "ECLIPSE100(<VERSION>=2021.1)",
            documentation: <IMarkdownString>{ value: dedent`
                Experimental alternative to FORWARD_MODEL
            `},
            insertText: "SIMULATION_JOB ${1:ECLIPSE100(<VERSION>=2021.1)}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "STOP_LONG_RUNNING",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Stop long realizations after minimum reached",
            usage: "TRUE",
            documentation: <IMarkdownString>{ value: dedent`
                The \`STOP_LONG_RUNNING\` key is used in combination with the
                \`MIN_REALIZATIONS\` key to control the runtime of simulations.
                When \`STOP_LONG_RUNNING\` is set to \`TRUE\`, \`MIN_REALIZATIONS\`
                is the minimum number of realizations run before the simulation is
                stopped. After \`MIN_REALIZATIONS have succeded successfully, the
                realizations left are allowed to run for 25% of the average runtime
                for successful realizations, and then killed.

                ### Example
                """
                    -- Stop long running realizations
                    -- after 20 realizations have succeeded
                    MIN_REALIZATIONS  20
                    STOP_LONG_RUNNING TRUE
                """

                The \`STOP_LONG_RUNNING\` key is optional. The
                \`MIN_REALIZATIONS\` key must be set when \`STOP_LONG_RUNNING\`
                is set to \`TRUE\`.
            `},
            insertText: "STOP_LONG_RUNNING ${1:TRUE}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "SUMMARY",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Add summary variables for internalization",
            usage: "FOPR*",
            documentation: <IMarkdownString>{ value: dedent`
                The \`SUMMARY\` keyword is used to add variables from the ECLIPSE
                summary file to the parametrization. The keyword expects a string,
                which should have the format \`VAR:WGRNAME\`. Here, \`VAR\` should
                be a quantity, such as \`WOPR\`, \`WGOR\`, \`RPR\` or \`GWCT\`.
                Moreover, \`WGRNAME\` should refer to a well, group, or region. If
                it is a field property, such as \`FOPT\`, \`WGRNAME\` need not be
                set to \`FIELD\`.

                Example
                """
                    -- Using the SUMMARY keyword to add
                    -- diagnostic variables
                    SUMMARY WOPR:MY_WELL
                    SUMMARY RPR:8
                    SUMMARY F*
                    -- Use of wildcards requires that
                    -- you have entered a REFCASE.
                """

                The \`SUMMARY\` keyword has limited support for \`*\` wildcards. If
                your key contains one or more \`*\` characters all matching variables
                from the refcase are selected. Observe that if your summary key
                contains wildcards you must supply a refcase with the \`REFCASE\`
                key - otherwise only fully expanded keywords will be used.

                **Note**: Properties added using the \`SUMMARY\` keyword are only
                diagnostic. I.e. they have no effect on the sensitivity analysis or
                history match.
            `},
            insertText: "SUMMARY ${1:FOPR}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "SURFACE",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: false,
            detail: "Surface parameter read from RMS IRAP file",
            usage: "TOP OUTPUT_FILE:ert_Top.irap "
                + "INIT_FILES:rms/output/hum/Top.irap "
                + "BASE_SURFACE:../../rms/output/hum/Top.irap "
                + "FORWARD_INIT:True",
            documentation: <IMarkdownString>{ value: dedent`
                The \`SURFACE\` keyword can be used to work with surface from RMS
                in the IRAP format. The \`SURFACE\` keyword is configured like this:

                """
                    SURFACE TOP OUTPUT_FILE:surf.irap INIT_FILES:Surfaces/surf%d.irap BASE_SURFACE:Surfaces/surf0.irap
                """

                The first argument, \`TOP\` in the example above, is the identifier
                you want to use for this surface in ERT. The \`OUTPUT_FILE\` key is
                the name of surface file which ERT will generate for you,
                \`INIT_FILES\` points to a list of files which are used to initialize,
                and \`BASE_SURFACE\` must point to one existing surface file. When
                loading the surfaces ERT will check that all the headers are
                compatible. An example of a surface IRAP file is:

                """text
                    -996 511     50.000000     50.000000
                    444229.9688   457179.9688  6809537.0000  6835037.0000
                    260      -30.0000   444229.9688  6809537.0000
                    0     0     0     0     0     0     0
                    2735.7461    2734.8909    2736.9705    2737.4048    2736.2539    2737.0122
                    2740.2644    2738.4014    2735.3770    2735.7327    2733.4944    2731.6448
                    2731.5454    2731.4810    2730.4644    2730.5591    2729.8997    2726.2217
                    2721.0996    2716.5913    2711.4338    2707.7791    2705.4504    2701.9187
                    ....
                """

                The surface data will typically be fed into other programs like Cohiba
                or RMS. The data can be updated using e.g. the smoother.

                When using \`FORWARD_INIT:True\` ERT will consider the INIT_FILES
                setting to find which file to initialize from. If the \`INIT_FILES\`
                setting contains a relative filename, it will be interpreted relatively
                to the runpath directory.
            `},
            insertText: "SURFACE ${1:TOP} OUTPUT_FILE:${2:file.irap} " +
                        "INIT_FILES:${3:rms/output/file.irap} " +
                        "BASE_SURFACE:${4:../../rms/output/file.irap}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [
                {
                    label: "BASE_SURFACE",
                    required: true,
                    numerical: false,
                    takesFilepath: true,
                    detail: "An existing surface file",
                    documentation: <IMarkdownString>{ value: dedent`
                        The IRAP surface being parametrized.
                    `},
                    delimiter: ":",
                },
                {
                    label: "INIT_FILES",
                    required: true,
                    numerical: false,
                    takesFilepath: true,
                    detail: "Filepath to a list of files",
                    documentation: <IMarkdownString>{ value: dedent`
                        This is a list of files which are used to initialize.
                        They may or may not have a \`%d\` modifier.
                    `},
                    delimiter: ":",
                },
                {
                    label: "OUTPUT_FILE",
                    required: true,
                    numerical: false,
                    takesFilepath: true,
                    detail: "Name of the generated file",
                    documentation: <IMarkdownString>{ value: dedent`
                        This is the name of the surface file that ERT will
                        generate for you.
                    `},
                    delimiter: ":",
                },
                {
                    label: "FORWARD_INIT",
                    required: false,
                    numerical: false,
                    takesFilepath: false,
                    detail: "True if relies on forward model",
                    documentation: <IMarkdownString>{ value: dedent`
                        True means that the files specified in the \`INIT_FILES\` are
                        expected to be created by a forward model, and does not need
                        any embedded \`%d\`. \`FORWARD_INIT:False\` means that the
                        files must have been created before running ERT and need
                        an embedded \`%d\`.
                    `},
                    delimiter: ":",
                    options: booleans,
                },
            ],
        },
        {
            label: "TIME_MAP",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Path to file mapping report steps and dates",
            usage: "../input/time_map.txt",
            documentation: <IMarkdownString>{ value: dedent`
                Normally the mapping between report steps and true dates is inferred
                by ERT indirectly by loading the ECLIPSE summary files. In cases
                where you do not have any ECLIPSE summary files you can use the
                \`TIME_MAP\` keyword to specify a file with dates which are used to
                establish this mapping:

                ### Example
                """
                    -- Load a list of dates from external file: "time_map.txt"
                    TIME_MAP time_map.txt
                """

                The format of the \`TIME_MAP\` file should just be a list of dates
                formatted as YYYY-MM-DD. The example file below has four dates:

                """text
                    2000-01-01
                    2000-07-01
                    2001-01-01
                    2001-07-01
                """
            `},
            insertText: "TIME_MAP ${1:../path/to/time_map.txt}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "UPDATE_LOG_PATH",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Directory where summary of update steps is stored",
            usage: "update_log",
            documentation: <IMarkdownString>{ value: dedent`
                A summary of the data used for updates are stored in this directory.
            `},
            insertText: "UPDATE_LOG_PATH ${1:update_log}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
        {
            label: "WORKFLOW_JOB_DIRECTORY",
            kind: languages.CompletionItemKind.Keyword,
            required: false,
            numerical: false,
            takesFilepath: true,
            detail: "Directory containing workflow jobs",
            usage: "../bin/jobs",
            documentation: <IMarkdownString>{ value: dedent`
                The \`WORKFLOW_JOB_DIRECTORY\` keyword will load all the jobs in
                a directory.

                Use the keyword \`WORKFLOW_JOB_DIRECTORY\` to specify a directory
                containing jobs:

                ### Example
                """
                    WORKFLOW_JOB_DIRECTORY /path/to/jobs
                """

                The \`WORKFLOW_JOB_DIRECTORY\` loads all workflow jobs found in the
                \`/path/to/jobs\` directory. Observe that all the files in the
                \`/path/to/jobs\` directory should be job configuration files. The
                jobs loaded in this way will all get the name of the file as the name
                of the job. The \`WORKFLOW_JOB_DIRECTORY\` keyword will not load
                configuration files recursively.
            `},
            insertText: "WORKFLOW_JOB_DIRECTORY ${1:../bin/jobs}",
            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
            parameters: [],
        },
    ];

    export const forwardModels = [
        "CAREFUL_COPY_FILE",
        "COPY_DIRECTORY",
        "COPY_FILE",
        "DELETE_DIRECTORY",
        "DELETE_FILE",
        "ECLIPSE300",
        "ECLIPSE100",
        "FLOW",
        "MAKE_DIRECTORY",
        "MOVE_FILE",
        "MAKE_SYMLINK",
        "RMS",
        "SYMLINK",
        "TEMPLATE_RENDER",
    ];

    export const lsfConfig = [
        "BJOBS_CMD",
        "BHIST_CMD",
        "BJOBS_TIMEOUT",
        "BKILL_CMD",
        "BSUB_CMD",
        "DEBUG_OUTPUT",
        "EXCLUDE_HOST",
        "LSF_QUEUE",
        "LSF_LOGIN_SHELL",
        "LSF_RESOURCE",
        "LSF_RSH_CMD",
        "LSF_SERVER",
        "MAX_RUNNING",
        "PROJECT_CODE",
        "SUBMIT_SLEEP",
    ];

    export const torqueConfig = [
        "CLUSTER_LABEL",
        "DEBUG_OUTPUT",
        "KEEP_QSUB_OUTPUT",
        "MAX_RUNNING",
        "NUM_NODES",
        "NUM_CPUS_PER_NODE",
        "QDEL_CMD",
        "QSUB_CMD",
        "QSTAT_CMD",
        "QUEUE",
        "QUEUE_QUERY_TIMEOUT",
        "SUBMIT_SLEEP",
        "TIMEOUT",
    ];

    export const slurmConfig = [
        "EXCLUDE_HOST",
        "INCLUDE_HOST",
        "MAX_RUNNING",
        "MAX_RUNTIME",
        "MEMORY",
        "MEMORY_PER_CPU",
        "PARTITION",
        "SBATCH",
        "SCANCEL",
        "SCONTROL",
        "SQUEUE",
        "SQUEUE_TIMEOUT",
    ];

    export const queues = [
        { label: "LOCAL", documentation: <IMarkdownString>{
            value: "Queue on the local machine" }
        },
        { label: "LSF", documentation: <IMarkdownString>{
            value: "Queue on an LSF cluster" }
        },
        { label: "SLURM", documentation: <IMarkdownString>{
            value: "Queue on a SLURM cluster" }
        },
        { label: "TORQUE", documentation: <IMarkdownString>{
            value: "Queue on a TORQUE cluster" }
        },
    ];

    export const workflowHookPoints = [
        { label: "PRE_FIRST_UPDATE", documentation: <IMarkdownString>{
            value: "Hook before the first update" }
        },
        { label: "PRE_SIMULATION", documentation: <IMarkdownString>{
            value: "Hook before the simulations" }
        },
        { label: "PRE_UPDATE", documentation: <IMarkdownString>{
            value: "Hook before the update step" }
        },
        { label: "POST_SIMULATION", documentation: <IMarkdownString>{
            value: "Hook after simulations have completed" }
        },
        { label: "POST_UPDATE", documentation: <IMarkdownString>{
            value: "Hook after the update step" }
        },
    ];

    export const historySources = [
        { label: "REFCASE_HISTORY", documentation: <IMarkdownString>{ value: dedent`
            This is the default value for \`HISTORY_SOURCE\`, ERT will fetch
            the historical values from the xxxH keywords in the refcase summary,
            e.g. observations of \`WGOR:OP_1\` is based the \`WGORH:OP_1\` vector
            from the refcase summary.`},
        },
        { label: "REFCASE_SIMULATED", documentation: <IMarkdownString>{ value: dedent`
            In this case the historical values are based on the simulated values
            from the refcase, this is mostly relevant when you want compare with
            another case which serves as 'the truth'.`},
        },
    ];

    export const summaryVectors = [
        { label: "NPV", documentation: <IMarkdownString>{ value: "Net Present Value" } },
        { label: "ELAPSED", documentation: <IMarkdownString>{ value: "Elapsed time in seconds" } },
        { label: "MLINEARS", documentation: <IMarkdownString>{
            value: "Linear iterations per time step" }
        },
        { label: "NEWTON", documentation: <IMarkdownString>{
            value: "Number of Newton iterations per time step" }
        },
        { label: "MSUMNEWTON", documentation: <IMarkdownString>{
            value: "Total number of Newton iterations for each time step" }
        },
        { label: "NLINEARS", documentation: <IMarkdownString>{
            value: "Average number of linear iterations per Newton iteration, for each time step" }
        },
        { label: "TCPU", documentation: <IMarkdownString>{ value: "Current CPU usage in seconds" } },
        { label: "TCPUTS", documentation: <IMarkdownString>{
            value: "CPU time per time step in seconds" }
        },
        { label: "TCPUDAY", documentation: <IMarkdownString>{ value: "CPU time per day" } },
        { label: "TIMESTEP", documentation: <IMarkdownString>{ value: "Time step lengths" } },
    ];
}
