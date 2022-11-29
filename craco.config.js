const {getLoader, loaderByName, addBeforeLoader} = require("@craco/craco");

const {CracoAliasPlugin} = require("react-app-alias");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
    webpack: {
        plugins: {
            add: [
                new MonacoWebpackPlugin({
                    customLanguages: ["yaml"],
                    globalAPI: true,
                    filename: "static/vs/[name].[contenthash].worker.js",
                }),
            ],
        },
        configure: (webpackConfig, {env}) => {
            const isEnvDevelopment = env === "development";

            webpackConfig.target = "electron-renderer";

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
