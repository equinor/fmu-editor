import {LanguageOptions, LanguageServiceDefaults} from "@shared-types/language-options";

import {Emitter, languages} from "monaco-editor";

import {languageId} from "./constants";
import {setupMode} from "./ertMode";
import {monarchConfiguration, monarchLanguage} from "./language";

export interface ErtOptions extends LanguageOptions {
    /**
     * The ERT version to use for parsing.
     *
     * @default '5.0'
     */
    readonly ertVersion?: "5.0";
}

const diagnosticDefault: ErtOptions = {
    completion: true,
    snippets: true,
    hover: true,
    validate: false,
    ertVersion: "5.0",
};

export function createLanguageServiceDefaults(initialErtOptions: ErtOptions): LanguageServiceDefaults {
    const onDidChange = new Emitter<LanguageServiceDefaults>();
    let diagnosticsOptions = initialErtOptions;

    const languageServiceDefaults: LanguageServiceDefaults = {
        get onDidChange() {
            return onDidChange.event;
        },

        get diagnosticsOptions() {
            return diagnosticsOptions;
        },

        setDiagnosticsOptions(options: ErtOptions) {
            diagnosticsOptions = {...diagnosticsOptions, ...options};
            onDidChange.fire(languageServiceDefaults);
        },
    };

    return languageServiceDefaults;
}

export const ertDefaults = createLanguageServiceDefaults(diagnosticDefault);

languages.register({
    id: languageId,
    extensions: [`.${languageId}`],
    aliases: ["ERT", "ert"],
    mimetypes: ["application/x-ert"],
});
languages.setMonarchTokensProvider(languageId, monarchLanguage);
languages.setLanguageConfiguration(languageId, monarchConfiguration);
languages.onLanguage(languageId, () => setupMode(ertDefaults));

export function setErtOptions(options: ErtOptions = {}): void {
    ertDefaults.setDiagnosticsOptions(options);
}
