import React from "react";

import {execSync} from "child_process";
import os from "os";

export class EnvironmentService {
    private constructor() {}

    public static getUsername(): string | null {
        try {
            return os.userInfo().username;
        } catch (e) {
            return null;
        }
    }

    public static getEnvironmentPath(): string | null {
        try {
            const path = execSync("echo $VIRTUAL_ENV").toString().trim();
            return path === "" ? null : path;
        } catch (e) {
            return null;
        }
    }
}

export const useEnvironmentService = (): {username: string | null; environmentPath: string | null} => {
    const [username, setUsername] = React.useState<string | null>(null);
    const [environmentPath, setEnvironmentPath] = React.useState<string | null>(null);

    React.useEffect(() => {
        setUsername(EnvironmentService.getUsername());
        setEnvironmentPath(EnvironmentService.getEnvironmentPath());
    }, []);

    return {username, environmentPath};
};
