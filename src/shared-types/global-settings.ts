export enum EditorType {
    Monaco = "monaco",
    CsvXlsx = "csv-xlsx",
}

export type GlobalSettings = {
    supportedFileExtensions: string[];
    languageForFileExtension: (extension: string) => string;
    editorTypeForFileExtension: (extension: string) => EditorType;
};
