'use strict';

var selectorRegex = "^[A-Z][a-zA-Z0-9]+(__[A-Z][a-zA-Z0-9]+)?(--?[a-z][a-zA-Z0-9]+)?$";

module.exports = {
    extends: "stylelint-config-standard",
    rules: {
        "selector-class-pattern": [
            selectorRegex,
            {
                message: (selector) => `Expected class selector "${selector}" to be UpperCase`
            }
        ],
        "selector-id-pattern": [
            selectorRegex,
            {
                message: (selector) => `Expected id selector "${selector}" to be UpperCase`
            }
        ]
    },
    ignoreFiles: ["**/monaco-ert/**"]
}
