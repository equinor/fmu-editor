import React from "react";

import {createGenericContext} from "@utils/generic-context";
import {PluginParser} from "@utils/plugin-parser";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {NotificationType} from "@shared-types/notifications";

import fs from "fs";

type Context = {
    pluginParser: PluginParser;
};

const [usePluginParserServiceContext, PluginParserServiceContextProvider] =
    createGenericContext<Context>();

export const PluginParserService: React.FC = props => {
    const pluginParser = React.useRef<PluginParser>(new PluginParser());
    const dispatch = useAppDispatch();

    const jsonSchemaPath = useAppSelector(
        state => state.preferences.pathToYamlSchemaFile
    );

    React.useEffect(() => {
        try {
            const fileContent = fs.readFileSync(jsonSchemaPath).toString();
            pluginParser.current.parse(JSON.parse(fileContent));
        } catch (e) {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: `Could not parse Webviz YAML schema. ${e}`,
                })
            );
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [jsonSchemaPath]);

    return (
        <PluginParserServiceContextProvider
            value={{pluginParser: pluginParser.current}}
        >
            {props.children}
        </PluginParserServiceContextProvider>
    );
};

export const usePluginParser = (): Context => usePluginParserServiceContext();
