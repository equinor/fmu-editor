import {useEnvironment} from "@services/environment-service";

import {useEffect} from "react";

import {preprocessJsonSchema} from "@utils/json-schema-preprocessor";

import {NotificationType} from "@components/Notifications";

import {useAppDispatch} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import fs from "fs";
import {SchemasSettings, setDiagnosticsOptions} from "monaco-yaml";
import path from "path";

export const useYamlSchemas = (yaml: any) => {
    const environment = useEnvironment();

    const dispatch = useAppDispatch();

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
                        const schemaName = file.split("_")[0];
                        schemas.push({
                            fileMatch: [`*`],
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
                    dispatch(
                        addNotification({
                            type: NotificationType.ERROR,
                            message: `Could not find schema directory: '${pathToSchemas}'. Are you sure you are in the correct environment?`,
                        })
                    );
                }
            } catch (e) {
                dispatch(
                    addNotification({
                        type: NotificationType.ERROR,
                        message: `Could not read schemas: ${e}`,
                    })
                );
            }
        }
    }, [environment, yaml, dispatch]);
};
