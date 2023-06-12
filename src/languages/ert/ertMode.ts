import {LanguageServiceDefaults} from "@shared-types/language-options";

import {languages} from "monaco-editor";

import {languageId} from "./constants";
import {createKeywordsCompletionProvider, createKeywordsHoverProvider} from "./providers";

export function setupMode(defaults: LanguageServiceDefaults): void {
    let keywordsCompletionProvider = languages.registerCompletionItemProvider(
        languageId,
        createKeywordsCompletionProvider(defaults.diagnosticsOptions)
    );
    let keywordsHoverProvider = languages.registerHoverProvider(
        languageId,
        createKeywordsHoverProvider(defaults.diagnosticsOptions)
    );
    defaults.onDidChange(() => {
        keywordsHoverProvider.dispose();
        keywordsHoverProvider = languages.registerHoverProvider(
            languageId,
            createKeywordsHoverProvider(defaults.diagnosticsOptions)
        );
        keywordsCompletionProvider.dispose();
        keywordsCompletionProvider = languages.registerCompletionItemProvider(
            languageId,
            createKeywordsCompletionProvider(defaults.diagnosticsOptions)
        );
    });
}
