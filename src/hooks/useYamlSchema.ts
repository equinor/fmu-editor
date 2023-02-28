import {useEnvironment} from "@services/environment-service";
import {notificationsService} from "@services/notifications-service";

import {useEffect} from "react";

import {preprocessJsonSchema} from "@utils/json-schema-preprocessor";

import {NotificationType} from "@shared-types/notifications";

import fs from "fs";
import {SchemasSettings, setDiagnosticsOptions} from "monaco-yaml";
import path from "path";

export const useYamlSchemas = (yaml: any) => {
    const environment = useEnvironment();

    useEffect(() => {
        if (environment.environmentPath) {
            const pathToSchemas = path.join(environment.environmentPath, "schemas");
            try {
                if (fs.existsSync(pathToSchemas)) {
                    const schemas: SchemasSettings[] = [];
                    fs.readdirSync(pathToSchemas).forEach(file => {
                        const schema = file.includes("webviz")
                            ? preprocessJsonSchema(path.join(pathToSchemas, file))
                            : JSON.parse(fs.readFileSync(path.join(pathToSchemas, file), "utf-8").toString());
                        schemas.push({
                            fileMatch: ["*"],
                            uri: `file://${path.join(pathToSchemas, file)}`,
                            schema,
                        });
                    });
                    setDiagnosticsOptions({
                        validate: true,
                        enableSchemaRequest: true,
                        hover: true,
                        completion: true,
                        format: true,
                        schemas,
                    });
                } else {
                    notificationsService.publishNotification({
                        type: NotificationType.ERROR,
                        message: `Could not find schema directory: '${pathToSchemas}'. Are you sure you are in the correct environment?`,
                    });
                }
            } catch (e) {
                notificationsService.publishNotification({
                    type: NotificationType.ERROR,
                    message: `Could not read schemas: ${e}`,
                });
            }
        }
    }, [environment, yaml]);
};
