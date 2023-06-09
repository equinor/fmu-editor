const path = require("path");
const webpack = require("webpack");

const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const getClientEnvironment = require("./webpack-utils/env");
const paths = require("./webpack-utils/paths");

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || "10000", 10);
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === "true";

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const hasJsxRuntime = (() => {
    if (process.env.DISABLE_NEW_JSX_TRANSFORM === "true") {
        return false;
    }

    try {
        require.resolve("react/jsx-runtime");
        return true;
    } catch (e) {
        return false;
    }
})();

module.exports = () => {
    // We will provide `paths.publicUrlOrPath` to our app
    // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
    // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
    // Get environment variables to inject into our app.
    const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

    const isEnvDevelopment = env.raw.NODE_ENV === "development";
    const isEnvProduction = !isEnvDevelopment;

    // common function to get style loaders
    const getStyleLoaders = (cssOptions, preProcessor) => {
        const loaders = [
            isEnvDevelopment && require.resolve("style-loader"),
            isEnvProduction && {
                loader: MiniCssExtractPlugin.loader,
                // css is located in `static/css`, use '../../' to locate index.html folder
                // in production `paths.publicUrlOrPath` can be a relative path
                options: paths.publicUrlOrPath.startsWith(".") ? {publicPath: "../../"} : {},
            },
            {
                loader: require.resolve("css-loader"),
                options: cssOptions,
            },
            {
                // Options for PostCSS as we reference these options twice
                // Adds vendor prefixing based on your specified browser support in
                // package.json
                loader: require.resolve("postcss-loader"),
                options: {
                    postcssOptions: {
                        // Necessary for external CSS imports to work
                        // https://github.com/facebook/create-react-app/issues/2677
                        ident: "postcss",
                        config: false,
                        plugins: [
                            "postcss-flexbugs-fixes",
                            [
                                "postcss-preset-env",
                                {
                                    autoprefixer: {
                                        flexbox: "no-2009",
                                    },
                                    stage: 3,
                                },
                            ],
                            // Adds PostCSS Normalize as the reset css with default options,
                            // so that it honors browserslist config in package.json
                            // which in turn let's users customize the target behavior as per their needs.
                            "postcss-normalize",
                        ],
                    },
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                },
            },
        ].filter(Boolean);
        if (preProcessor) {
            loaders.push(
                {
                    loader: require.resolve("resolve-url-loader"),
                    options: {
                        sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                        root: paths.src,
                    },
                },
                {
                    loader: require.resolve(preProcessor),
                    options: {
                        sourceMap: true,
                    },
                }
            );
        }
        return loaders;
    };

    const shouldUseReactRefresh = true;

    const makeRendererConfig = preview => ({
        name: preview ? "preview" : "main",
        mode: isEnvDevelopment ? "development" : "production",
        target: preview ? "web" : "electron-renderer",
        entry: preview
            ? {
                  preview: path.resolve(paths.src, path.join("preview", "index.tsx")),
              }
            : {main: path.resolve(paths.src, "index.tsx")},
        devtool: isEnvProduction ? "source-map" : isEnvDevelopment && "cheap-module-source-map",
        output: {
            path: paths.build,
            pathinfo: isEnvDevelopment,
            filename: "static/js/[name].bundle.js",
            chunkFilename: isEnvProduction
                ? "static/js/[name].[contenthash:8].chunk.js"
                : isEnvDevelopment && "static/js/[name].chunk.js",
            assetModuleFilename: "static/media/[name].[hash][ext]",
            publicPath: paths.publicUrlOrPath,
            devtoolModuleFilenameTemplate: isEnvProduction
                ? info => path.relative(paths.src, info.absoluteResourcePath).replace(/\\/g, "/")
                : isEnvDevelopment && (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")),
        },
        module: {
            strictExportPresence: true,
            rules: [
                {
                    // "oneOf" will traverse all following loaders until one will
                    // match the requirements. When no loader matches it will fall
                    // back to the "file" loader at the end of the loader list.
                    oneOf: [
                        {
                            test: [/\.avif$/],
                            type: "asset",
                            mimetype: "image/avif",
                            parser: {
                                dataUrlCondition: {
                                    maxSize: imageInlineSizeLimit,
                                },
                            },
                        },
                        // "url" loader works like "file" loader except that it embeds assets
                        // smaller than specified limit in bytes as data URLs to avoid requests.
                        // A missing `test` is equivalent to a match.
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            type: "asset",
                            parser: {
                                dataUrlCondition: {
                                    maxSize: imageInlineSizeLimit,
                                },
                            },
                        },
                        {
                            test: /\.svg$/,
                            use: [
                                {
                                    loader: require.resolve("@svgr/webpack"),
                                    options: {
                                        prettier: false,
                                        svgo: false,
                                        svgoConfig: {
                                            plugins: [{removeViewBox: false}],
                                        },
                                        titleProp: true,
                                        ref: true,
                                    },
                                },
                                {
                                    loader: require.resolve("file-loader"),
                                    options: {
                                        name: "static/media/[name].[hash].[ext]",
                                    },
                                },
                            ],
                            issuer: {
                                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
                            },
                        },
                        // Process application JS with Babel.
                        // The preset includes JSX, Flow, TypeScript, and some ESnext features.
                        {
                            test: /\.(js|mjs|jsx|ts|tsx)$/,
                            include: [paths.src, path.join(paths.appNodeModules, "@microsoft", "mgt-components")],
                            loader: require.resolve("babel-loader"),
                            options: {
                                customize: require.resolve("babel-preset-react-app/webpack-overrides"),
                                presets: [
                                    [
                                        require.resolve("babel-preset-react-app"),
                                        {
                                            runtime: hasJsxRuntime ? "automatic" : "classic",
                                        },
                                    ],
                                ],
                                plugins: [
                                    isEnvDevelopment && shouldUseReactRefresh && require.resolve("react-refresh/babel"),
                                ].filter(Boolean),
                                // This is a feature of `babel-loader` for webpack (not Babel itself).
                                // It enables caching results in ./node_modules/.cache/babel-loader/
                                // directory for faster rebuilds.
                                cacheDirectory: true,
                                // See #6846 for context on why cacheCompression is disabled
                                cacheCompression: false,
                                compact: isEnvProduction,
                            },
                        },
                        // Process any JS outside of the app with Babel.
                        // Unlike the application JS, we only compile the standard ES features.
                        {
                            test: /\.(js|mjs)$/,
                            exclude: /@babel(?:\/|\\{1,2})runtime/,
                            loader: require.resolve("babel-loader"),
                            options: {
                                babelrc: false,
                                configFile: false,
                                compact: false,
                                presets: [[require.resolve("babel-preset-react-app/dependencies"), {helpers: true}]],
                                cacheDirectory: true,
                                // See #6846 for context on why cacheCompression is disabled
                                cacheCompression: false,
                                // Babel sourcemaps are needed for debugging into node_modules
                                // code.  Without the options below, debuggers like VSCode
                                // show incorrect code and set breakpoints on the wrong lines.
                                sourceMaps: shouldUseSourceMap,
                                inputSourceMap: shouldUseSourceMap,
                            },
                        },
                        // "postcss" loader applies autoprefixer to our CSS.
                        // "css" loader resolves paths in CSS and adds assets as dependencies.
                        // "style" loader turns CSS into JS modules that inject <style> tags.
                        // In production, we use MiniCSSExtractPlugin to extract that CSS
                        // to a file, but in development "style" loader enables hot editing
                        // of CSS.
                        // By default we support CSS Modules with the extension .module.css
                        {
                            test: cssRegex,
                            exclude: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                                modules: {
                                    mode: "icss",
                                },
                            }),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true,
                        },
                        // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
                        // using the extension .module.css
                        {
                            test: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                                modules: {
                                    mode: "local",
                                    getLocalIdent: getCSSModuleLocalIdent,
                                },
                            }),
                        },
                        // Opt-in support for SASS (using .scss or .sass extensions).
                        // By default we support SASS Modules with the
                        // extensions .module.scss or .module.sass
                        {
                            test: sassRegex,
                            exclude: sassModuleRegex,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 3,
                                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                                    modules: {
                                        mode: "icss",
                                    },
                                },
                                "sass-loader"
                            ),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true,
                        },
                        // Adds support for CSS Modules, but using SASS
                        // using the extension .module.scss or .module.sass
                        {
                            test: sassModuleRegex,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 3,
                                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                                    modules: {
                                        mode: "local",
                                        getLocalIdent: getCSSModuleLocalIdent,
                                    },
                                },
                                "sass-loader"
                            ),
                        },
                        // "file" loader makes sure those assets get served by WebpackDevServer.
                        // When you `import` an asset, you get its (virtual) filename.
                        // In production, they would get copied to the `build` folder.
                        // This loader doesn't use a "test" so it will catch all modules
                        // that fall through the other loaders.
                        {
                            // Exclude `js` files to keep "css" loader working as it injects
                            // its runtime that would otherwise be processed through "file" loader.
                            // Also exclude `html` and `json` extensions so they get processed
                            // by webpacks internal loaders.
                            exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
                            type: "asset/resource",
                        },
                    ],
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
            new MonacoWebpackPlugin({
                languages: ["yaml"],
                globalAPI: true,
                filename: "static/vs/[name].[contenthash].worker.js",
            }),
            new HtmlWebpackPlugin({
                inject: true,
                template: path.join(paths.public, preview ? "preview.html" : "index.html"),
                filename: preview ? "preview.html" : "index.html",
            }),
            // Makes some environment variables available in index.html.
            // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
            // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
            // It will be an empty string unless you specify "homepage"
            // in `package.json`, in which case it will be the pathname of that URL.
            new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
            // This gives some necessary context to module not found errors, such as
            // the requesting resource.
            new ModuleNotFoundPlugin(paths.appPath),
            // Makes some environment variables available to the JS code, for example:
            // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
            // It is absolutely essential that NODE_ENV is set to production
            // during a production build.
            // Otherwise React will be compiled in the very slow development mode.
            new webpack.DefinePlugin(env.stringified),
            // Experimental hot reloading for React .
            // https://github.com/facebook/react/tree/main/packages/react-refresh
            isEnvDevelopment &&
                shouldUseReactRefresh &&
                new ReactRefreshWebpackPlugin({
                    overlay: false,
                }),
            isEnvDevelopment && new CaseSensitivePathsPlugin(),
            isEnvProduction &&
                new MiniCssExtractPlugin({
                    filename: isEnvProduction ? "css/[name].[contenthash].chunk.css" : "css/[name].css",
                }),
            new ESLintPlugin({
                // Plugin options
                extensions: ["js", "mjs", "jsx", "ts", "tsx"],
                formatter: require.resolve("react-dev-utils/eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
                context: paths.src,
                cache: true,
                cacheLocation: path.resolve(paths.appNodeModules, ".cache/.eslintcache"),
                // ESLint class options
                cwd: paths.appPath,
                resolvePluginsRelativeTo: __dirname,
                baseConfig: {
                    extends: [require.resolve("eslint-config-react-app/base")],
                    rules: {
                        ...(!hasJsxRuntime && {
                            "react/react-in-jsx-scope": "error",
                        }),
                    },
                },
            }),
        ].filter(Boolean),
        performance: false,
        ignoreWarnings: [/Failed to parse source map/],
        stats: "none",
        optimization: {
            minimize: isEnvProduction,
            minimizer: [
                // This is only used in production mode
                new TerserPlugin({
                    terserOptions: {
                        parse: {
                            // We want terser to parse ecma 8 code. However, we don't want it
                            // to apply any minification steps that turns valid ecma 5 code
                            // into invalid ecma 5 code. This is why the 'compress' and 'output'
                            // sections only apply transformations that are ecma 5 safe
                            // https://github.com/facebook/create-react-app/pull/4234
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            // Disabled because of an issue with Uglify breaking seemingly valid code:
                            // https://github.com/facebook/create-react-app/issues/2376
                            // Pending further investigation:
                            // https://github.com/mishoo/UglifyJS2/issues/2011
                            comparisons: false,
                            // Disabled because of an issue with Terser breaking valid code:
                            // https://github.com/facebook/create-react-app/issues/5250
                            // Pending further investigation:
                            // https://github.com/terser-js/terser/issues/120
                            inline: 2,
                        },
                        mangle: {
                            safari10: true,
                        },
                        // Added for profiling in devtools
                        keep_classnames: false,
                        keep_fnames: false,
                        output: {
                            ecma: 5,
                            comments: false,
                            // Turned on because emoji and regex is not minified properly using default
                            // https://github.com/facebook/create-react-app/issues/2488
                            ascii_only: true,
                        },
                    },
                }),
                // This is only used in production mode
                new CssMinimizerPlugin(),
            ],
        },
    });

    return [makeRendererConfig(false), makeRendererConfig(true)];
};
