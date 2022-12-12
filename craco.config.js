const {getLoader, loaderByName, addBeforeLoader} = require("@craco/craco");

const {CracoAliasPlugin} = require("react-app-alias");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const path = require("path");

module.exports = {
    webpack: {
        plugins: {
            add: [
                new MonacoWebpackPlugin({
                    languages: ["yaml"],
                    globalAPI: true,
                    filename: "static/vs/[name].[contenthash].worker.js",
                }),
                new HtmlWebpackPlugin({
                    template: "./public/index.html",
                    filename: "index.html",
                    chunks: ["main"],
                }),
                new HtmlWebpackPlugin({
                    template: "./public/preview.html",
                    filename: "preview.html",
                    chunks: ["preview"],
                }),
            ],
            remove: [
                "HtmlWebpackPlugin",
            ]
        },
        configure: (webpackConfig, {env}) => {
            const isEnvDevelopment = env === "development";

            webpackConfig.target = "electron-renderer";

            webpackConfig.entry = {
                main: "./src/index.tsx",
                preview: "./src/preview/index.tsx",
            };

            webpackConfig.ignoreWarnings = [/Failed to parse source map/];

            if (isEnvDevelopment) {
                webpackConfig.output.filename = "static/js/[name].bundle.js";
            }

            return webpackConfig;
        },
    },
    plugins: [
        {
            plugin: CracoAliasPlugin,
            options: {
                source: "tsconfig",
                baseUrl: "./",
                tsConfigPath: "./paths.json",
                unsafeAllowModulesOutsideOfSrc: false,
                debug: false,
            },
        },
    ],
};
