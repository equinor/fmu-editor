import {BookType} from "xlsx";

export enum EditorType {
    Monaco = "monaco",
    SpreadSheet = "spreadsheet",
}

export type ExtensionsLanguageMap = {
    [key: string]: {
        language: string;
        bookType?: BookType;
        editorType: EditorType;
    };
};

const extensionsLanguageMap = {
    ".csv": {
        language: "csv",
        bookType: "csv",
        editorType: EditorType.SpreadSheet,
    },
    ".xlsx": {
        language: "xlsx",
        bookType: "xlsx",
        editorType: EditorType.SpreadSheet,
    },
    ".xls": {
        language: "xls",
        bookType: "xls",
        editorType: EditorType.SpreadSheet,
    },
    ".ert": {language: "ert", editorType: EditorType.Monaco},
    ".py": {language: "python", editorType: EditorType.Monaco},
    ".json": {language: "json", editorType: EditorType.Monaco},
    ".sh": {language: "shell", editorType: EditorType.Monaco},
    ".txt": {language: "text", editorType: EditorType.Monaco},
    ".xml": {language: "xml", editorType: EditorType.Monaco},
    ".yaml": {language: "yaml", editorType: EditorType.Monaco},
    ".yml": {language: "yaml", editorType: EditorType.Monaco},
};

export class GlobalSettings {
    static supportedFileExtensions(): string[] {
        return [".csv", ".ert", ".json", ".sh", ".py", ".txt", ".xml", ".yaml", ".yml"];
    }

    static languageForFileExtension(extension: string): string {
        return extensionsLanguageMap[extension].language || "text";
    }

    static editorTypeForFileExtension(extension: string): EditorType {
        return extensionsLanguageMap[extension].editorType || EditorType.Monaco;
    }

    static bookTypeForFileExtension(extension: string): BookType | null {
        return extensionsLanguageMap[extension].bookType || null;
    }
}
