const ElectronStore = require("electron-store");

const IPosition = {
    type: "object",
    properties: {
        lineNumber: {
            type: "number",
        },
        column: {
            type: "number",
        },
    },
};

const ICursorState = {
    type: "object",
    properties: {
        inSelectionMode: {
            type: "boolean",
        },
        selectionStart: IPosition,
        position: IPosition,
    },
};

const IViewState = {
    type: "object",
    properties: {
        scrollTop: {
            type: "number",
        },
        scrollTopWithoutViewZones: {
            type: "number",
        },
        scrollLeft: {
            type: "number",
        },
        firstPosition: IPosition,
        firstPositionDeltaTop: {
            type: "number",
        },
    },
};

const ICodeEditorViewState = {
    type: "object",
    properties: {
        cursorState: {
            type: "array",
            items: ICursorState,
        },
        viewState: IViewState,
    },
};

const SpreadSheetEditorViewState = {
    type: "object",
    properties: {
        visibleWorkSheetName: {
            type: "string",
        },
        viewStates: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    scrollLeft: {
                        type: "number",
                    },
                    scrollTop: {
                        type: "number",
                    },
                    selection: {
                        type: "object",
                        properties: {
                            start: {
                                type: "object",
                                properties: {
                                    row: {
                                        type: "number",
                                    },
                                    column: {
                                        type: "number",
                                    },
                                },
                            },
                            end: {
                                type: "object",
                                properties: {
                                    row: {
                                        type: "number",
                                    },
                                    column: {
                                        type: "number",
                                    },
                                },
                            },
                        },
                    },
                    workSheetName: {
                        type: "string",
                    },
                },
            },
        },
    },
};

const schema = {
    ui: {
        type: "object",
        properties: {
            activeView: {
                type: "string",
            },
            settings: {
                type: "object",
                properties: {
                    theme: {
                        type: "string",
                    },
                },
            },
            paneConfiguration: {
                type: "object",
                patternProperties: {
                    ".*": {
                        type: "array",
                        items: {
                            type: "number",
                        },
                    },
                },
            },
        },
    },
    files: {
        type: "object",
        properties: {
            activeFile: {
                type: "string",
            },
            files: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                        },
                        editorViewState: {
                            oneOf: [ICodeEditorViewState, {type: "string"}, SpreadSheetEditorViewState],
                        },
                    },
                },
            },
        },
    },
};

const defaults = {
    ui: {
        settings: {
            theme: "light",
            editorFontSize: 1.0,
        },
        paneConfiguration: {
            "editor-issues": [75, 25],
            "file-explorer": [25, 75],
            "editor-preview": [50, 50],
            pull: [25, 75],
            "source-control": [25, 75],
            "single-file-changes": [25, 75],
            "user-changes": [25, 75],
        },
    },
    files: {
        activeFile: "",
        files: [],
    },
};

const electronStore = new ElectronStore({
    schema,
    defaults,
});

export default electronStore;
