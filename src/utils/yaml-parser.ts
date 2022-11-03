import {
    GroupType,
    NavigationType,
    PageType,
    SectionType,
} from "@shared-types/navigation";

import yaml from "yaml";

type Unpacked<T> = T extends (infer U)[] ? U : T;

export enum YamlObjectType {
    Title = "TITLE",
    // SharedSettings
    Options = "OPTIONS",
    Layout = "LAYOUT",
}

export enum YamlLayoutObjectType {
    Section = "SECTION",
    Group = "GROUP",
    Page = "PAGE",
    Plugin = "PLUGIN",
    PlainText = "PLAINTEXT",
}

export interface YamlMetaObject {
    startLineNumber: number;
    endLineNumber: number;
}

export interface YamlObject extends YamlMetaObject {
    type: YamlObjectType;
    id: string;
    key: string;
    value: string | YamlObject[] | OptionsObject[] | LayoutObject[];
}

export interface LayoutObject extends YamlMetaObject {
    type: YamlLayoutObjectType;
    id: string;
    number: number;
    name?: string;
    icon?: string;
    children: LayoutObject[] | PluginArgumentObject[];
}

export interface PluginArgumentObject extends YamlMetaObject {
    id: string;
    name: string;
    value: string | PluginArgumentObject[] | (string | boolean | number)[];
}

export type OptionsObject = {
    key: string;
    value: boolean | string | number | OptionsObject[];
};

type BlockMapItem = Unpacked<Pick<yaml.CST.BlockMap, "items">["items"]>;

type DefinedBlockMapItem = {
    start: yaml.CST.SourceToken[];
    key: yaml.CST.Token;
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.Token;
};

type BlockSequenceItem = Unpacked<
    Pick<yaml.CST.BlockSequence, "items">["items"]
>;

type BlockMapScalarItem = {
    start: yaml.CST.SourceToken[];
    key: yaml.CST.FlowScalar;
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.FlowScalar;
};

type BlockMapBlockMapItem = {
    start: yaml.CST.SourceToken[];
    key: yaml.CST.FlowScalar;
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.BlockMap;
};

type BlockMapBlockSequenceItem = {
    start: yaml.CST.SourceToken[];
    key: yaml.CST.FlowScalar;
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.BlockSequence;
};

type SectionMap = {
    start: yaml.CST.SourceToken[];
    key: Omit<yaml.CST.FlowScalar, "type" | "source"> & {
        type: "scalar";
        source: "section" | "icon" | "content";
    };
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.FlowScalar | yaml.CST.BlockSequence;
}[];

type GroupMap = {
    start: yaml.CST.SourceToken[];
    key: Omit<yaml.CST.FlowScalar, "type" | "source"> & {
        type: "scalar";
        source: "group" | "icon" | "content";
    };
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.FlowScalar | yaml.CST.BlockSequence;
}[];

type PageMap = {
    start: yaml.CST.SourceToken[];
    key: Omit<yaml.CST.FlowScalar, "type" | "source"> & {
        type: "scalar";
        source: "page" | "icon" | "content";
    };
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.FlowScalar | yaml.CST.BlockSequence;
}[];

type PluginMap = {
    start: yaml.CST.SourceToken[];
    key: Omit<yaml.CST.FlowScalar, "type"> & {type: "scalar"};
    sep: yaml.CST.SourceToken[];
    value: yaml.CST.BlockMap;
};

type IdLinesMapType = {
    id: string;
    startLineNumber: number;
    endLineNumber: number;
    object: YamlObject | LayoutObject | OptionsObject;
};

type RegisteredElements = {
    indent: number;
    numberElements: number;
};

type NumberOfLayoutItems = {
    sections: number;
    groups: number;
    pages: number;
    plugins: number;
};

export class YamlParser {
    private objects: YamlObject[];
    private parsedString: string;
    private idObjectsMap: IdLinesMapType[];
    private registeredElements: RegisteredElements[];
    private numberOfLayoutItems: NumberOfLayoutItems;
    private anchors: {[key: string]: yaml.CST.Token | undefined};
    constructor() {
        this.objects = [];
        this.parsedString = "";
        this.idObjectsMap = [];
        this.registeredElements = [];
        this.numberOfLayoutItems = {
            sections: 0,
            groups: 0,
            pages: 0,
            plugins: 0,
        };
        this.anchors = {};
    }

    getLineNumber(offset: number): number {
        return this.parsedString.substr(0, offset).split("\n").length;
    }

    getTotalNumLines(): number {
        return this.parsedString.split("\n").length;
    }

    getEndLineNumber(item: yaml.CST.Token): number {
        let object: yaml.CST.Token = item;
        /* eslint-disable no-constant-condition */
        while (true) {
            if (
                object === undefined ||
                (object.type !== "block-seq" && object.type !== "block-map")
            ) {
                break;
            }
            if (object.items.length > 0) {
                if (object.items[object.items.length - 1].value) {
                    object = object.items[object.items.length - 1]
                        .value as yaml.CST.Token;
                } else if (object.items[object.items.length - 1].start[0]) {
                    object = object.items[object.items.length - 1].start[0];
                } else {
                    break;
                }
                /* eslint-disable no-continue */
                continue;
            }
            break;
        }
        return this.getLineNumber(object.offset);
    }

    private makeId(indent: number): string {
        const object = this.registeredElements.find(el => el.indent === indent);
        let number = 0;
        if (object) {
            number = object.numberElements;
            object.numberElements += 1;
        } else {
            this.registeredElements.push({
                indent,
                numberElements: 1,
            });
            number = 0;
        }
        return `${indent}-${number}`;
    }

    private reset() {
        this.parsedString = "";
        this.objects = [];
        this.idObjectsMap = [];
        this.numberOfLayoutItems = {
            sections: 0,
            groups: 0,
            pages: 0,
            plugins: 0,
        };
    }

    parse(value: string): void {
        this.reset();
        this.parsedString = value;
        const tokens = new yaml.Parser().parse(value);
        /* eslint-disable no-restricted-syntax */
        for (const token of tokens) {
            /*
            At the outermost level, expected tokens are:
            - comment (ignore)
            - newline (ignore)
            - document
            */
            if (YamlParser.isDocumentToken(token)) {
                this.parseDocument(token as yaml.CST.Document);
            }
        }
    }

    private static isScalarKeyItem(item: BlockMapItem): boolean {
        return (
            item.key !== undefined &&
            item.key !== null &&
            item.key.type === "scalar"
        );
    }

    private static isScalarItem(item: BlockMapItem): boolean {
        return (
            YamlParser.isScalarKeyItem(item) &&
            item.value !== undefined &&
            item.value.type === "scalar"
        );
    }

    private static isBlockMapItem(item: BlockMapItem): boolean {
        return (
            YamlParser.isScalarKeyItem(item) &&
            item.value !== undefined &&
            item.value.type === "block-map"
        );
    }

    private static isBlockSequenceItem(item: BlockMapItem): boolean {
        return (
            YamlParser.isScalarKeyItem(item) &&
            item.value !== undefined &&
            item.value.type === "block-seq"
        );
    }

    private static isScalarKeyItemWithValue(
        item: BlockMapItem | BlockSequenceItem,
        keyValue: string
    ): boolean {
        return (
            item.key !== undefined &&
            item.key !== null &&
            item.key.type === "scalar" &&
            item.key.source === keyValue
        );
    }

    private static isDocumentToken(token: yaml.CST.Token): boolean {
        return token && token.type === "document";
    }

    private static isTitleItem(item: BlockMapItem): boolean {
        if (this.isScalarKeyItemWithValue(item, "title")) {
            if (item.value && item.value.type === "scalar") {
                return true;
            }
        }
        return false;
    }

    private static isAnchorItem(item: BlockMapItem): boolean {
        if (
            item.key !== undefined &&
            item.key !== null &&
            item.key.type === "scalar" &&
            item.sep.find(s => s.type === "anchor")
        ) {
            const anchorName = item.sep.find(s => s.type === "anchor")?.source;
            if (item.value && anchorName) {
                return true;
            }
        }
        return false;
    }

    private static isOptionsItem(item: BlockMapItem): boolean {
        if (this.isScalarKeyItemWithValue(item, "options")) {
            if (item.value && item.value.type === "block-map") {
                return true;
            }
        }
        return false;
    }

    private static isLayoutItem(item: BlockMapItem): boolean {
        if (this.isScalarKeyItemWithValue(item, "layout")) {
            if (item.value && item.value.type === "block-seq") {
                return true;
            }
        }
        return false;
    }

    private parseDocument(document: yaml.CST.Document) {
        // A document should contain a "block-map" as first child
        if (document.value && document.value.type === "block-map") {
            document.value.items.forEach((item: BlockMapItem) => {
                /* Three different items are expected:
                - title
                - options (optional)
                - layout
                */
                if (YamlParser.isTitleItem(item)) {
                    this.objects.push(
                        this.makeTitleObject(item as BlockMapScalarItem)
                    );
                }

                if (YamlParser.isOptionsItem(item)) {
                    this.objects.push(
                        this.makeOptionsObject(item as BlockMapBlockMapItem)
                    );
                }

                if (YamlParser.isAnchorItem(item)) {
                    this.makeAnchorObject(item as BlockMapItem);
                }

                if (YamlParser.isLayoutItem(item)) {
                    this.objects.push(
                        this.makeLayoutObject(item as BlockMapBlockSequenceItem)
                    );
                }
            });
        }
    }

    /* eslint-disable no-dupe-class-members */
    private registerObject(
        object: Omit<YamlObject, "id" | "startLineNumber" | "endLineNumber">,
        item: DefinedBlockMapItem | yaml.CST.FlowScalar | DefinedBlockMapItem[]
    ): YamlObject;
    private registerObject(
        object: Omit<LayoutObject, "id" | "startLineNumber" | "endLineNumber">,
        item: DefinedBlockMapItem | yaml.CST.FlowScalar | DefinedBlockMapItem[]
    ): LayoutObject;
    private registerObject(object: any, item: any) {
        let startLineNumber = 0;
        let endLineNumber = 0;

        if (item.constructor === Array) {
            startLineNumber = this.getLineNumber(item[0].key.offset);
            endLineNumber = this.getEndLineNumber(item[item.length - 1].value);
        } else if ("key" in item) {
            startLineNumber = this.getLineNumber(item.key.offset);
            endLineNumber = this.getEndLineNumber(item.value);
        } else if ("offset" in item) {
            startLineNumber = this.getLineNumber(item.offset);
            endLineNumber = this.getEndLineNumber(item);
        }
        const id = this.makeId(item.indent || 0);
        const newObject = {...object, id, startLineNumber, endLineNumber};
        this.idObjectsMap.push({
            id,
            object: newObject,
            startLineNumber,
            endLineNumber,
        });
        return newObject;
    }

    private makeTitleObject(titleItem: BlockMapScalarItem): YamlObject {
        return this.registerObject(
            {
                type: YamlObjectType.Title,
                key: titleItem.key.source,
                value: titleItem.value.source,
            },
            titleItem
        ) as YamlObject;
    }

    private makeOptionsObject(optionsItem: BlockMapBlockMapItem): YamlObject {
        return this.registerObject(
            {
                type: YamlObjectType.Options,
                key: optionsItem.key.source,
                value: this.parseOptions(optionsItem.value),
            },
            optionsItem
        );
    }

    private makeAnchorObject(anchorItem: BlockMapItem) {
        const anchorName = anchorItem.sep?.find(
            s => s.type === "anchor"
        )?.source;
        if (anchorName) {
            this.anchors[anchorName.substring(1)] = anchorItem.value;
        }
    }

    private makeLayoutObject(
        layoutItem: BlockMapBlockSequenceItem
    ): YamlObject {
        return this.registerObject(
            {
                type: YamlObjectType.Layout,
                key: layoutItem.key.source,
                value: this.parseLayout(layoutItem.value),
            },
            layoutItem
        );
    }

    private parseOptions(options: yaml.CST.BlockMap): OptionsObject[] {
        const optionsObjectList: OptionsObject[] = [];
        options.items.forEach((item: BlockMapItem) => {
            if (YamlParser.isScalarItem(item)) {
                const scalarItem = item as BlockMapScalarItem;
                optionsObjectList.push({
                    key: scalarItem.key.source,
                    value: scalarItem.value.source,
                });
            } else if (YamlParser.isBlockMapItem(item)) {
                const blockMapItem = item as BlockMapBlockMapItem;
                optionsObjectList.push({
                    key: blockMapItem.key.source,
                    value: this.parseOptions(blockMapItem.value),
                });
            }
        });
        return optionsObjectList;
    }

    private parseLayout(layout: yaml.CST.BlockSequence): LayoutObject[] {
        const layoutObjectList: LayoutObject[] = [];
        layout.items.forEach((sequence: BlockSequenceItem) => {
            if (sequence.value && sequence.value.type === "block-map") {
                if (YamlParser.isSectionMap(sequence.value)) {
                    layoutObjectList.push(
                        this.makeSectionObject(
                            sequence.value.items as SectionMap
                        )
                    );
                } else if (YamlParser.isGroupMap(sequence.value)) {
                    layoutObjectList.push(
                        this.makeGroupObject(sequence.value.items as GroupMap)
                    );
                } else if (YamlParser.isPageMap(sequence.value)) {
                    layoutObjectList.push(
                        this.makePageObject(sequence.value.items as PageMap)
                    );
                } else if (YamlParser.isPluginMap(sequence.value)) {
                    layoutObjectList.push(
                        this.makePluginObject(
                            sequence.value.items[0] as PluginMap
                        )
                    );
                }
            } else if (sequence.value && sequence.value.type === "scalar") {
                layoutObjectList.push(
                    this.makePlainTextObject(
                        sequence.value as yaml.CST.FlowScalar
                    )
                );
            }
        });
        return layoutObjectList;
    }

    private makePlainTextObject(value: yaml.CST.FlowScalar): LayoutObject {
        return this.registerObject(
            {
                type: YamlLayoutObjectType.PlainText,
                name: value.source,
                children: [],
                number: this.numberOfLayoutItems.plugins++,
            },
            value
        );
    }

    private makeSectionObject(map: SectionMap): LayoutObject {
        const section = map.find(el => el.key.source === "section");
        const icon = map.find(el => el.key.source === "icon");
        const content = map.find(el => el.key.source === "content");
        return this.registerObject(
            {
                type: YamlLayoutObjectType.Section,
                name: (section?.value as yaml.CST.FlowScalar).source || "",
                icon: (icon?.value as yaml.CST.FlowScalar)?.source,
                children: content
                    ? this.parseLayout(content.value as yaml.CST.BlockSequence)
                    : [],
                number: this.numberOfLayoutItems.sections++,
            },
            map
        );
    }

    private makeGroupObject(map: GroupMap): LayoutObject {
        const section = map.find(el => el.key.source === "group");
        const icon = map.find(el => el.key.source === "icon");
        const content = map.find(el => el.key.source === "content");
        return this.registerObject(
            {
                type: YamlLayoutObjectType.Group,
                name: (section?.value as yaml.CST.FlowScalar).source || "",
                icon: (icon?.value as yaml.CST.FlowScalar)?.source,
                children: content
                    ? this.parseLayout(content.value as yaml.CST.BlockSequence)
                    : [],
                number: this.numberOfLayoutItems.groups++,
            },
            map
        );
    }

    private makePageObject(map: PageMap): LayoutObject {
        const section = map.find(el => el.key.source === "page");
        const icon = map.find(el => el.key.source === "icon");
        const content = map.find(el => el.key.source === "content");
        return this.registerObject(
            {
                type: YamlLayoutObjectType.Page,
                name: (section?.value as yaml.CST.FlowScalar).source || "",
                icon: (icon?.value as yaml.CST.FlowScalar)?.source,
                children: content
                    ? this.parseLayout(content.value as yaml.CST.BlockSequence)
                    : [],
                number: this.numberOfLayoutItems.pages++,
            },
            map
        );
    }

    private makePluginObject(map: PluginMap): LayoutObject {
        const name = map.key.source;
        const options = map.value.items;
        return this.registerObject(
            {
                type: YamlLayoutObjectType.Plugin,
                name,
                children: this.parsePluginOptions(options),
                number: this.numberOfLayoutItems.plugins++,
            },
            map
        );
    }

    private parsePluginOptions(
        options: BlockMapItem[]
    ): PluginArgumentObject[] {
        const optionObjects: PluginArgumentObject[] = [];
        options.forEach((option: BlockMapItem) => {
            if (option.key && option.value && option.key.type === "scalar") {
                if (
                    option.value.type === "alias" &&
                    Object.keys(this.anchors).includes(
                        option.value.source.substring(1)
                    ) &&
                    this.anchors[option.value.source.substring(1)] !== undefined
                ) {
                    option.value = this.anchors[
                        option.value.source.substring(1)
                    ] as yaml.CST.Token;
                }
                if (
                    option.value.type === "scalar" ||
                    option.value.type === "single-quoted-scalar" ||
                    option.value.type === "double-quoted-scalar"
                ) {
                    optionObjects.push({
                        id: this.makeId(option.key.indent),
                        name: option.key.source,
                        value: option.value.source,
                        startLineNumber: this.getLineNumber(option.key.offset),
                        endLineNumber: this.getEndLineNumber(option.value),
                    });
                } else if (option.value.type === "block-seq") {
                    const valueList = option.value.items
                        .filter(
                            (el: BlockSequenceItem) =>
                                el.value &&
                                (el.value.type === "scalar" ||
                                    el.value.type === "single-quoted-scalar" ||
                                    el.value.type === "double-quoted-scalar")
                        )
                        .map(el => (el.value as yaml.CST.FlowScalar).source);
                    optionObjects.push({
                        id: this.makeId(option.key.indent),
                        name: option.key.source,
                        value: valueList,
                        startLineNumber: this.getLineNumber(option.key.offset),
                        endLineNumber: this.getEndLineNumber(option.value),
                    });
                } else if (option.value.type === "block-map") {
                    optionObjects.push({
                        id: this.makeId(option.key.indent),
                        name: option.key.source,
                        value: this.parsePluginOptions(option.value.items),
                        startLineNumber: this.getLineNumber(option.key.offset),
                        endLineNumber: this.getEndLineNumber(option.value),
                    });
                }
            }
        });
        return optionObjects;
    }

    private static isMapOfType(map: yaml.CST.BlockMap, type: string): boolean {
        if (
            map.items.length >= 2 &&
            map.items.length <= 3 &&
            map.items.some(
                el =>
                    el.key &&
                    el.key.type === "scalar" &&
                    el.key.source === type &&
                    el.value &&
                    el.value.type === "scalar"
            ) &&
            map.items.some(
                el =>
                    el.key &&
                    el.key.type === "scalar" &&
                    el.key.source === "content" &&
                    el.value &&
                    el.value.type === "block-seq"
            )
        ) {
            return true;
        }
        return false;
    }

    private static isSectionMap(map: yaml.CST.BlockMap): boolean {
        return this.isMapOfType(map, "section");
    }

    private static isGroupMap(map: yaml.CST.BlockMap): boolean {
        return this.isMapOfType(map, "group");
    }

    private static isPageMap(map: yaml.CST.BlockMap): boolean {
        return this.isMapOfType(map, "page");
    }

    private static isPluginMap(map: yaml.CST.BlockMap): boolean {
        if (
            map.items.length === 1 &&
            map.items[0].key &&
            map.items[0].key.type === "scalar" &&
            map.items[0].value &&
            map.items[0].value.type === "block-map"
        ) {
            return true;
        }
        return false;
    }

    getObjects(): YamlObject[] {
        return this.objects;
    }

    findClosestObject(
        startLineNumber: number,
        endLineNumber: number
    ): YamlMetaObject {
        let objects: (YamlObject | LayoutObject)[] = this.getObjects();
        let lastMatchingObject: YamlObject | LayoutObject = objects[0];
        let breakLoop = false;
        /* eslint-disable no-constant-condition */
        while (true) {
            let numMatches = 0;
            for (let i = 0; i < objects.length; i++) {
                const object = objects[i];
                if (
                    object.startLineNumber <= startLineNumber &&
                    object.endLineNumber >= endLineNumber
                ) {
                    numMatches++;
                    lastMatchingObject = object;
                    if (
                        "value" in object &&
                        object.value.constructor === Array &&
                        object.value.length > 0 &&
                        object.value[0].constructor === Object &&
                        "id" in object.value[0]
                    ) {
                        objects = object.value as YamlObject[] | LayoutObject[];
                    } else if (
                        "children" in object &&
                        object.children.constructor === Array &&
                        object.children.length > 0 &&
                        "id" in object.children[0]
                    ) {
                        objects = object.children as LayoutObject[];
                    } else {
                        breakLoop = true;
                    }
                    break;
                }
            }
            if (breakLoop || !lastMatchingObject || numMatches === 0) {
                break;
            }
        }
        return lastMatchingObject;
    }

    findClosestPage(
        startLineNumber: number,
        endLineNumber: number
    ): LayoutObject | undefined {
        let objects: (YamlObject | LayoutObject)[] = this.getObjects();
        let lastMatchingObject: LayoutObject | YamlObject = objects[0];
        let breakLoop = false;
        /* eslint-disable no-constant-condition */
        while (true) {
            let numMatches = 0;
            for (let i = 0; i < objects.length; i++) {
                const object = objects[i];
                if (
                    object.startLineNumber <= startLineNumber &&
                    object.endLineNumber >= endLineNumber
                ) {
                    numMatches++;
                    lastMatchingObject = object as LayoutObject;
                    if (
                        "value" in object &&
                        object.value.constructor === Array &&
                        object.value.length > 0 &&
                        "id" in object.value[0]
                    ) {
                        objects = object.value as YamlObject[] | LayoutObject[];
                    } else if (
                        "children" in object &&
                        object.children.constructor === Array &&
                        object.children.length > 0 &&
                        "id" in object.children[0]
                    ) {
                        objects = object.children as LayoutObject[];
                    } else {
                        breakLoop = true;
                    }
                    if (object.type === YamlLayoutObjectType.Page) {
                        breakLoop = true;
                    }
                    break;
                }
            }
            if (breakLoop || !lastMatchingObject || numMatches === 0) {
                break;
            }
        }
        if (lastMatchingObject.type === YamlLayoutObjectType.Page) {
            return lastMatchingObject as LayoutObject;
        }
        return undefined;
    }

    getObjectById(id: string): LayoutObject | undefined {
        const object = this.idObjectsMap.find(el => el.id === id)?.object;
        if (
            object &&
            "type" in object &&
            object.type === YamlLayoutObjectType.Page
        ) {
            return object;
        }
        return undefined;
    }

    getTitle(): string {
        return (
            (this.objects.find(el => el.type === YamlObjectType.Title)
                ?.value as string) || ""
        );
    }

    private parseNavigationItems(
        items: LayoutObject[],
        currentId: number
    ): (GroupType | PageType | SectionType)[] {
        const navigationItems: (GroupType | PageType | SectionType)[] = [];
        items.forEach(item => {
            if (item.type === YamlLayoutObjectType.Section) {
                navigationItems.push({
                    id: item.id,
                    type: "section",
                    title: item.name || "",
                    icon: item.icon,
                    content: this.parseNavigationItems(
                        item.children as LayoutObject[],
                        currentId
                    ) as (GroupType | PageType)[],
                });
            } else if (item.type === YamlLayoutObjectType.Group) {
                navigationItems.push({
                    id: item.id,
                    type: "group",
                    title: item.name || "",
                    icon: item.icon,
                    content: this.parseNavigationItems(
                        item.children as LayoutObject[],
                        currentId
                    ) as (GroupType | PageType)[],
                });
            } else if (item.type === YamlLayoutObjectType.Page) {
                navigationItems.push({
                    id: item.id,
                    type: "page",
                    title: item.name || "",
                    icon: item.icon,
                    href: item.id,
                });
            }
        });
        return navigationItems;
    }

    getNavigationItems(): NavigationType {
        const layout = this.objects.find(
            el => el.type === YamlObjectType.Layout
        );
        const currentId = 0;
        if (layout) {
            return this.parseNavigationItems(
                layout.value as LayoutObject[],
                currentId
            ) as NavigationType;
        }
        return [];
    }
}
