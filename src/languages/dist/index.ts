import {Size} from "@shared-types/size";

import {Emitter, languages} from "monaco-editor";

import {LanguageServiceDefaults, languageId} from "./constants";
import {setupMode} from "./distMode";
import {monarchConfiguration, monarchLanguage} from "./language";

export interface DistOptions {
    /**
     * If set, enable autocompletion.
     *
     * @default true
     */
    readonly completion?: boolean;

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

    /**
     * The size of the distribution plot on hover.
     *
     * @default { width: 235, height: 235 }
     */
    readonly plotSize?: Size;
}

const diagnosticDefault: DistOptions = {
    completion: true,
    hover: true,
    validate: false,
    plotSize: {width: 235, height: 235},
};

const createLanguageServiceDefaults = (initialDiagnosticsOptions: DistOptions): LanguageServiceDefaults => {
    const onDidChange = new Emitter<LanguageServiceDefaults>();
    let diagnosticsOptions = initialDiagnosticsOptions;

    const languageServiceDefaults: LanguageServiceDefaults = {
        get onDidChange() {
            return onDidChange.event;
        },

        get diagnosticsOptions() {
            return diagnosticsOptions;
        },

        setDiagnosticsOptions(options: DistOptions) {
            diagnosticsOptions = {...diagnosticsOptions, ...options};
            onDidChange.fire(languageServiceDefaults);
        },
    };
    return languageServiceDefaults;
};

const distDefaults = createLanguageServiceDefaults(diagnosticDefault);

languages.register({
    id: languageId,
    extensions: [`.${languageId}`],
    aliases: ["DIST"],
    mimetypes: ["application/x-dist"],
});
languages.setMonarchTokensProvider(languageId, monarchLanguage);
languages.setLanguageConfiguration(languageId, monarchConfiguration);
languages.onLanguage(languageId, () => setupMode(distDefaults));

export const setDistOptions = (options: DistOptions = {}): void => {
    distDefaults.setDiagnosticsOptions(options);
};
