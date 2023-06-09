import {IEvent} from "monaco-editor";

export interface LanguageOptions {
    /**
     * If set, enable autocompletion.
     *
     * @default true
     */
    readonly completion?: boolean;

    /**
     * If set, enable snippets.
     *
     * @default true
     */
    readonly snippets?: boolean;

    /**
     * If set, enable hover.
     *
     * @default true
     */
    readonly hover?: boolean;

    /**
     * If set, the configuration file will be validated.
     *
     * @default false
     */
    readonly validate?: boolean;
}

export interface LanguageServiceDefaults {
    readonly onDidChange: IEvent<LanguageServiceDefaults>;
    readonly diagnosticsOptions: LanguageOptions;
    setDiagnosticsOptions: (options: LanguageOptions) => void;
}
