export type GlobalSettings = {
    supportedFileExtensions: string[];
    languageForFileExtension: (extension: string) => string;
};
