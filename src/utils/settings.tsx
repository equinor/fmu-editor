import {Setting, SettingMeta} from "@shared-types/settings";

export const Settings: {[key: string]: SettingMeta[]} = {
    Python: [
        {
            id: "python-interpreter",
            label: "Python Interpreter",
            description:
                "Select the Python interpreter that you are using with Webviz.",
            type: "pythonInterpreter",
            defaultValue: "",
            needsInitialization: true,
        },
    ],
    Webviz: [
        {
            id: "schema",
            label: "Webviz Schema",
            description: (
                <>
                    Select the Webviz schema file. Read&nbsp;
                    <a
                        href="https://equinor.github.io/webviz-config/#/?id=yaml-schema"
                        target="blank"
                    >
                        here
                    </a>{" "}
                    how to create a schemafile.
                </>
            ),
            type: "file",
            defaultValue: "",
            fileFilter: [
                {
                    name: "Webviz JSON Schema File",
                    extensions: ["json"],
                },
            ],
            needsInitialization: true,
        },
        {
            id: "theme",
            label: "Theme",
            description: "Select the theme you want to use with Webviz.",
            type: "theme",
            defaultValue: "",
        },
    ],
};

export const compressSettings = (settings: {
    [key: string]: SettingMeta[];
}): Setting[] => {
    const compressedSettings: Setting[] = [];
    Object.keys(settings).forEach((category: string) => {
        settings[category].forEach(setting => {
            compressedSettings.push({
                id: setting.id,
                value: setting.defaultValue,
            });
        });
    });
    return compressedSettings;
};
