import * as fs from "fs";
import parseJson from "parse-json";
import * as edsIcons from "@equinor/eds-icons";

export const preprocessJsonSchema = (path: string): object => {
    const allIcons = Object.values(edsIcons).map((el) => el.name);
    const fileContent = fs.readFileSync(path);
    const json = parseJson(fileContent.toString(), path);
    if ("properties" in json) {
        if ("layout" in json["properties"]) {
            if ("items" in json["properties"]["layout"]) {
                if (
                    "oneOf" in json["properties"]["layout"]["items"] &&
                    json["properties"]["layout"]["items"]["oneOf"].constructor === Array
                ) {
                    if ("properties" in json["properties"]["layout"]["items"]["oneOf"][0]) {
                        if ("icon" in json["properties"]["layout"]["items"]["oneOf"][0]["properties"]) {
                            json["properties"]["layout"]["items"]["oneOf"][0]["properties"]["icon"]["enum"] = allIcons;
                        }
                    }
                    if ("properties" in json["properties"]["layout"]["items"]["oneOf"][1]) {
                        if ("icon" in json["properties"]["layout"]["items"]["oneOf"][1]["properties"]) {
                            json["properties"]["layout"]["items"]["oneOf"][1]["properties"]["icon"]["enum"] = allIcons;
                        }
                    }
                    if ("properties" in json["properties"]["layout"]["items"]["oneOf"][2]) {
                        if ("icon" in json["properties"]["layout"]["items"]["oneOf"][2]["properties"]) {
                            json["properties"]["layout"]["items"]["oneOf"][2]["properties"]["icon"]["enum"] = allIcons;
                        }
                    }
                }
            }
        }
    }
    return json;
};
