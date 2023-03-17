const path = require("path");
const webpack = require("webpack");

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const getClientEnvironment = require("./webpack-utils/env");
const paths = require("./webpack-utils/paths");

module.exports = () => {
    // We will provide `paths.publicUrlOrPath` to our app
    // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
    // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
    // Get environment variables to inject into our app.
    const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

    const isEnvDevelopment = env.raw.NODE_ENV === "development";

    return {
        mode: isEnvDevelopment ? "development" : "production",
        target: "electron-main",
        entry: path.join(paths.electron, "main.ts"),
        module: {
            rules: [
                {
                    test: /\.node$/,
                    loader: "node-loader",
                },
                {
                    test: /\.(t|j)s?$/,
                    use: "ts-loader",
                    include: [paths.electron, path.resolve(paths.src, "shared-types"), paths.appNodeModules],
                },
            ],
        },
        output: {
            path: paths.build,
            filename: "main.js",
        },
        resolve: {
            plugins: [new TsconfigPathsPlugin()],
            extensions: [".ts", ".js"],
        },
        // https://stackoverflow.com/questions/52125641/electronwebpack-module-not-found-error-cant-resolve-fsevents-fs-etc-in-cho
        plugins: [new webpack.IgnorePlugin({resourceRegExp: /^fsevents$/})],
    };
};
