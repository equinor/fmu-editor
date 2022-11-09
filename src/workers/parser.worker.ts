import {YamlParser} from "@utils/yaml-parser";

import {YamlParserWorkerRequestType, YamlParserWorkerResponseType} from "@shared-types/yaml-parser-worker";

const yamlParser = new YamlParser();

const watchFmuDirectory = () => {};

// @ts-ignore
/* eslint-disable-next-line */
self.addEventListener("message", event => {
    switch (event.data.type) {
        case YamlParserWorkerRequestType.Parse:
            yamlParser.parse(event.data.text);
            // @ts-ignore
            /* eslint-disable-next-line */
            self.postMessage({
                type: YamlParserWorkerResponseType.Parsed,
                objects: yamlParser.getObjects(),
                title: yamlParser.getTitle(),
                navigationItems: yamlParser.getNavigationItems(),
            });
            break;
        case YamlParserWorkerRequestType.GetClosestObject:
            // @ts-ignore
            /* eslint-disable-next-line */
            self.postMessage({
                type: YamlParserWorkerResponseType.ClosestObject,
                object: yamlParser.findClosestObject(event.data.startLineNumber, event.data.endLineNumber),
                page: yamlParser.findClosestPage(event.data.startLineNumber, event.data.endLineNumber),
            });
            break;
        case YamlParserWorkerRequestType.GetObjectById:
            // @ts-ignore
            /* eslint-disable-next-line */
            self.postMessage({
                type: YamlParserWorkerResponseType.ObjectById,
                object: yamlParser.getObjectById(event.data.id),
            });
            break;
        default:
    }
});
