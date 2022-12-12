const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
    // Mode

    let mode;
    if (argv && argv.mode) {
        mode = argv.mode;
    } else {
        mode = "production";
    }

    const makeConfig = (preview) => ({
        mode,
        target: preview ? "web" : "electron-renderer",
        entry: preview ? {
          preview: "./src/preview/index.tsx" }: {main: "./src/index.tsx"},
        devtool: mode === "production" ? false : "inline-source-map",
        output: {
            path: path.join(__dirname, "/dist"),
            filename: "static/js/[name].bundle.js",
        },
        devServer: {
            static: "./dist",
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    resolve: {
                        fullySpecified: false,
                    },
                },
                {
                    test: /\.[j|t]sx?$/,
                    exclude: /node_modules/,
                    loader: "babel-loader",
                },
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader:
                                mode === "production"
                                    ? MiniCssExtractPlugin.loader
                                    : "style-loader",
                        },
                        "css-loader",
                    ],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    use: {
                        loader: "url-loader",
                    },
                },
            ],
        },
        resolve: {
            plugins: [new TsconfigPathsPlugin()],
            extensions: [".tsx", ".ts", ".js"],
            alias: {
                "react/jsx-dev-runtime.js": "react/jsx-dev-runtime",
                "react/jsx-runtime.js": "react/jsx-runtime",
            },
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: preview ? "./public/preview.html" : "./public/index.html",
                filename: preview ? "preview.html" : "index.html",
                chunks: preview ? ["preview"] : ["main"],
            }),
            new webpack.ProvidePlugin({
                process: "process/browser",
            }),
            new MiniCssExtractPlugin({
                filename:
                    mode === "production"
                        ? "css/[name].[contenthash].chunk.css"
                        : "css/[name].css",
            }),
            ...(env.analyze
                ? [new WebpackBundleAnalyzer.BundleAnalyzerPlugin()]
                : []),
        ],
        ignoreWarnings: [/Failed to parse source map/],
        optimization: {
            minimize: true,
            minimizer: [new TerserPlugin(), new CssMinimizerPlugin({})],
            splitChunks: {
                chunks: "all",
            },
        },
    });

    return [makeConfig(false), makeConfig(true)];
};
