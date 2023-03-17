const fs = require("fs");
const path = require("path");

const getPublicUrlOrPath = require("react-dev-utils/getPublicUrlOrPath");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
const publicUrlOrPath = getPublicUrlOrPath(
    process.env.NODE_ENV === "development",
    /* eslint-disable-next-line import/no-dynamic-require */
    require(resolveApp("package.json")).homepage,
    process.env.PUBLIC_URL
);

module.exports = {
    electron: resolveApp("electron"),
    src: resolveApp("src"),
    build: resolveApp("build"),
    dist: resolveApp("dist"),
    public: resolveApp("public"),
    assets: resolveApp("static"),
    appPath: resolveApp("."),
    appPackageJson: resolveApp("package.json"),
    appNodeModules: resolveApp("node_modules"),
    publicUrlOrPath,
    appTsBuildInfoFile: resolveApp("node_modules/.cache/tsconfig.tsbuildinfo"),
};
