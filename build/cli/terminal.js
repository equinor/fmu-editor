"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const fs = require('fs');
const getResourcesPath = () => process.resourcesPath;
exports.default = () => {
    const commandPath = path.resolve(getResourcesPath(), `app/darwin/bin/webviz-config-editor.sh`);
    const commandName = 'webviz-config-editor';
    return new Promise((resolve, reject) => {
        if (typeof commandPath !== 'string' || typeof commandName !== 'string') {
            reject(new TypeError('Expected a string'));
        }
        if (process.platform !== 'darwin') {
            reject(new Error('Your platform is not supported'));
        }
        const destinationPath = path.join('/usr/local/bin', commandName);
        // Do not catch Error
        fs.readlink(destinationPath, (_, realPath) => {
            if (realPath === commandPath) {
                resolve();
                return;
            }
            fs.unlink(destinationPath, (err) => {
                if (err && err.code && err.code !== 'ENOENT') {
                    reject(err);
                }
                fs.symlink(commandPath, destinationPath, (e) => {
                    if (e) {
                        reject(e);
                    }
                    resolve();
                });
            });
        });
    });
};
//# sourceMappingURL=terminal.js.map