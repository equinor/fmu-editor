"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFileDialog = exports.selectFileDialog = exports.findWebvizThemes = exports.findPythonInterpreters = exports.checkIfPythonInterpreter = exports.openFile = void 0;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const python_shell_1 = require("python-shell");
const which = __importStar(require("which"));
const env_1 = require("./env");
const isDev = env_1.PROCESS_ENV.NODE_ENV === "development";
const openFile = () => {
    electron_1.dialog
        .showOpenDialog({
        properties: ["openFile"],
        filters: [
            {
                name: "Webviz Config Files",
                extensions: ["yml", "yaml"],
            },
        ],
    })
        .then((fileObj) => {
        const window = electron_1.BrowserWindow.getFocusedWindow();
        if (!fileObj.canceled && window) {
            window.webContents.send("file-opened", fileObj.filePaths);
        }
    })
        .catch(err => {
        console.error(err);
    });
};
exports.openFile = openFile;
const checkIfPythonInterpreter = (pythonInterpreter) => {
    let message = "";
    try {
        if (fs.existsSync(pythonInterpreter)) {
            try {
                fs.accessSync(pythonInterpreter, fs.constants.X_OK);
                try {
                    const regExp = new RegExp("\\[('[a-zA-Z0-9\\.\\-_/\\\\]{0,}'(, )?)+\\]");
                    const response = child_process_1.execSync(`${pythonInterpreter} -c "import sys; print(sys.path)"`).toString();
                    if (!regExp.test(response)) {
                        throw Error("Invalid Python interpreter");
                    }
                    return {
                        success: true,
                        message,
                    };
                }
                catch (error) {
                    message = "Invalid Python interpreter.";
                }
            }
            catch (error) {
                message = "File is not executable.";
            }
        }
        else {
            message = "File does not exist.";
        }
    }
    catch (error) {
        message = "Invalid file path.";
    }
    return {
        success: false,
        message,
    };
};
exports.checkIfPythonInterpreter = checkIfPythonInterpreter;
const findPythonInterpreters = (event) => {
    let options = [];
    let success = true;
    try {
        which.default("python", { all: true }, (err, resolvedPaths) => {
            if (err) {
                try {
                    which.default("python3", { all: true }, (error, resolvedPaths2) => {
                        if (error) {
                            options = [];
                            success = false;
                        }
                        else if (resolvedPaths2 === undefined) {
                            options = [];
                        }
                        else if (resolvedPaths2.constructor === Array) {
                            options = resolvedPaths2;
                        }
                        else if (resolvedPaths2.constructor === String) {
                            options = [resolvedPaths2];
                        }
                        event.sender.send("python-interpreters", {
                            options,
                            success,
                        });
                    });
                }
                catch (e) {
                    success = false;
                    event.sender.send("python-interpreters", {
                        options: [],
                        success: false,
                    });
                }
            }
            else if (resolvedPaths === undefined) {
                options = [];
                event.sender.send("python-interpreters", {
                    options,
                    success,
                });
            }
            else if (resolvedPaths.constructor === Array) {
                options = resolvedPaths;
                event.sender.send("python-interpreters", {
                    options,
                    success,
                });
            }
            else if (resolvedPaths.constructor === String) {
                options = [resolvedPaths];
                event.sender.send("python-interpreters", {
                    options,
                    success,
                });
            }
        });
    }
    catch (err) {
        try {
            which.default("python3", { all: true }, (error, resolvedPaths) => {
                if (error) {
                    success = false;
                }
                if (resolvedPaths === undefined) {
                    options = [];
                }
                else if (resolvedPaths.constructor === Array) {
                    options = resolvedPaths;
                }
                else if (resolvedPaths.constructor === String) {
                    options = [resolvedPaths];
                }
                event.sender.send("python-interpreters", {
                    options,
                    success,
                });
            });
        }
        catch (error) {
            success = false;
            event.sender.send("python-interpreters", { options, success });
        }
    }
};
exports.findPythonInterpreters = findPythonInterpreters;
const findWebvizThemes = (pythonPath, event) => {
    let themes = [];
    let success = false;
    const opts = {
        mode: "json",
        pythonPath,
    };
    python_shell_1.PythonShell.run(path.resolve(electron_1.app.getAppPath(), isDev ? "" : "..", "python", "webviz_themes.py"), opts, (err, output) => {
        if (output && output.length > 0 && "themes" in output[0]) {
            themes = output[0]["themes"];
            success = true;
        }
        else {
            success = false;
        }
        event.reply("webviz-themes", { themes, success });
    });
};
exports.findWebvizThemes = findWebvizThemes;
const selectFileDialog = (event, options) => {
    var _a;
    const browserWindow = electron_1.BrowserWindow.fromId(event.sender.id);
    let dialogOptions = {};
    if (options.isDirectoryExplorer) {
        dialogOptions.properties = ["openDirectory"];
    }
    else {
        if (options.allowMultiple) {
            dialogOptions.properties = ["multiSelections"];
        }
        if (options.filters) {
            dialogOptions.filters = options.filters;
        }
    }
    (_a = dialogOptions.properties) === null || _a === void 0 ? void 0 : _a.push("createDirectory");
    if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
    }
    if (browserWindow) {
        return electron_1.dialog.showOpenDialogSync(browserWindow, dialogOptions);
    }
    return electron_1.dialog.showOpenDialogSync(dialogOptions);
};
exports.selectFileDialog = selectFileDialog;
/**
 * prompts to select a file using the native dialogs
 */
const saveFileDialog = (event, options) => {
    var _a;
    const browserWindow = electron_1.BrowserWindow.fromId(event.sender.id);
    let dialogOptions = {};
    if (options.filters) {
        dialogOptions.filters = options.filters;
    }
    (_a = dialogOptions.properties) === null || _a === void 0 ? void 0 : _a.push("createDirectory");
    if (options.defaultPath) {
        dialogOptions.defaultPath = options.defaultPath;
    }
    if (options.title) {
        dialogOptions.title = options.title;
    }
    if (browserWindow) {
        return electron_1.dialog.showSaveDialogSync(browserWindow, dialogOptions);
    }
    return electron_1.dialog.showSaveDialogSync(dialogOptions);
};
exports.saveFileDialog = saveFileDialog;
const getUserDataDir = () => {
    return electron_1.app.getPath("userData");
};
//# sourceMappingURL=commands.js.map