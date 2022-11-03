export interface Setting {
    id: string;
    value: string | number | boolean;
}

export type FileFilter = {
    name: string;
    extensions: string[];
};

export interface SettingMeta {
    id: string;
    label: string;
    description: React.ReactNode | string;
    type: "string" | "number" | "file" | "pythonInterpreter" | "theme";
    defaultValue: string | number | boolean;
    fileFilter?: FileFilter[];
    needsInitialization?: boolean;
}
