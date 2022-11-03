import {LayoutObject, YamlMetaObject, YamlObject} from "@utils/yaml-parser";
import {PropertyNavigationType} from "./navigation";

export enum YamlParserWorkerRequestType {
    Parse = "PARSE",
    ParseAndSetSelection = "PARSE_AND_SET_SELECTION",
    GetClosestPage = "GET_CLOSEST_PAGE",
    GetClosestObject = "GET_CLOSEST_OBJECT",
    GetObjectById = "GET_OBJECT_BY_ID",
}

export enum YamlParserWorkerResponseType {
    Parsed = "PARSED",
    ParsedAndSetSelection = "PARSED_AND_SET_SELECTION",
    ClosestPage = "CLOSEST_PAGE",
    ClosestObject = "CLOSEST_OBJECT",
    ObjectById = "OBJECT_BY_ID",
}

export type YamlParserWorkerRequestData =
    | {
          type: YamlParserWorkerRequestType.Parse;
          text: string;
      }
    | {
          type: YamlParserWorkerRequestType.ParseAndSetSelection;
          startLineNumber: number;
          endLineNumber: number;
      }
    | {
          type: YamlParserWorkerRequestType.GetClosestObject;
          startLineNumber: number;
          endLineNumber: number;
      }
    | {
          type: YamlParserWorkerRequestType.GetObjectById;
          id: string;
      };

export type YamlParserWorkerResponseData =
    | {
          type: YamlParserWorkerResponseType.Parsed;
          objects: YamlObject[];
          title: string;
          navigationItems: PropertyNavigationType;
      }
    | {
          type: YamlParserWorkerResponseType.ParsedAndSetSelection;
          objects: YamlObject[];
          selectedObject: YamlObject;
          page?: LayoutObject;
      }
    | {
          type: YamlParserWorkerResponseType.ClosestObject;
          object: YamlMetaObject;
          page?: LayoutObject;
      }
    | {type: YamlParserWorkerResponseType.ObjectById; object: YamlMetaObject};
