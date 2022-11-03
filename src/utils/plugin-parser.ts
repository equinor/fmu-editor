export type Plugin = {
    name: string;
    description: string;
    properties?: object;
    requiredProperties?: string[];
};

export class PluginParser {
    private plugins: Plugin[];
    constructor() {
        this.plugins = [];
    }

    parse(jsonSchema: {[key: string]: object | object[]}) {
        this.plugins = [];
        const path: (string | number)[] = [
            "properties",
            "layout",
            "items",
            "oneOf",
            2,
            "properties",
            "content",
            "items",
            "oneOf",
        ];
        let pluginList: any = jsonSchema;

        path.forEach(key => {
            if (key in pluginList) {
                pluginList = pluginList[key];
            }
        });

        Object.values(pluginList).forEach((topLevelPlugin: any) => {
            if (
                "type" in topLevelPlugin &&
                topLevelPlugin["type"] === "string"
            ) {
                this.plugins.push({
                    name: "Text",
                    description: "Plain text.",
                });
            } else if (
                "type" in topLevelPlugin &&
                topLevelPlugin["type"] === "object" &&
                "properties" in topLevelPlugin
            ) {
                const name = topLevelPlugin["required"][0];
                const value = topLevelPlugin["properties"][name];
                if (typeof name === "string") {
                    this.plugins.push({
                        name,
                        description: (value as any)["description"],
                        properties: (value as any)["properties"],
                        requiredProperties: (value as any)["required"] || [],
                    });
                }
            }
        });
    }

    getPlugin(name: string): Plugin | null {
        return this.plugins.find(el => el.name === name) || null;
    }

    getPlugins(): Plugin[] {
        return this.plugins;
    }
}
