import moduleAlias from "module-alias";

import paths from "../../paths.json";

moduleAlias.addAliases({
    ...Object.keys(paths.compilerOptions.paths).reduce((acc, key: string) => {
        const value: string = (paths.compilerOptions.paths as {[key: string]: string[]})[key][0];
        acc[key.replace("/*", "")] = `${__dirname}/../${value.replace("/*", "")}`;
        return acc;
    }, {} as {[key: string]: string}),
});
