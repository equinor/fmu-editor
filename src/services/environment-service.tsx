import React from "react";

import {MessageBus} from "@src/framework/message-bus";

import {execSync} from "child_process";
import os from "os";

import {ServiceBase} from "./service-base";

export enum EnvironmentServiceTopics {
    USERNAME_CHANGED = "USERNAME_CHANGED",
    USERNAME_COULD_NOT_BE_FETCHED = "USERNAME_COULD_NOT_BE_FETCHED",
    ENVIRONMENT_PATH_CHANGED = "ENVIRONMENT_PATH_CHANGED",
    ENVIRONMENT_PATH_COULD_NOT_BE_FETCHED = "ENVIRONMENT_PATH_COULD_NOT_BE_FETCHED",
}

export type EnvironmentServiceMessages = {
    [EnvironmentServiceTopics.USERNAME_CHANGED]: {
        username: string | null;
    };

    [EnvironmentServiceTopics.ENVIRONMENT_PATH_CHANGED]: {
        environmentPath: string | null;
    };
    [EnvironmentServiceTopics.ENVIRONMENT_PATH_COULD_NOT_BE_FETCHED]: undefined;
    [EnvironmentServiceTopics.USERNAME_COULD_NOT_BE_FETCHED]: undefined;
};

export class EnvironmentService extends ServiceBase<EnvironmentServiceMessages> {
    private username: string | null;
    private environmentPath: string | null;
    private interval: ReturnType<typeof setInterval>;

    constructor() {
        super();
        this.fetchUsername();
        this.fetchEnvironmentPath();

        this.interval = setInterval(() => {
            this.fetchUsername();
            this.fetchEnvironmentPath();
        }, 10000);
    }

    destructor() {
        clearInterval(this.interval);
    }

    private fetchUsername(): void {
        try {
            const newUsername = os.userInfo().username;
            if (this.username !== newUsername) {
                this.username = newUsername;
                this.messageBus.publish(EnvironmentServiceTopics.USERNAME_CHANGED, {username: newUsername});
            }
        } catch (e) {
            this.username = null;
            this.messageBus.publish(EnvironmentServiceTopics.USERNAME_COULD_NOT_BE_FETCHED);
        }
    }

    private fetchEnvironmentPath(): void {
        try {
            const path = execSync("echo $VIRTUAL_ENV").toString().trim();
            const newPath = path === "" ? null : path;
            if (this.environmentPath !== newPath) {
                this.environmentPath = newPath;
                this.messageBus.publish(EnvironmentServiceTopics.ENVIRONMENT_PATH_CHANGED, {
                    environmentPath: newPath,
                });
            }
        } catch (e) {
            this.environmentPath = null;
            this.messageBus.publish(EnvironmentServiceTopics.ENVIRONMENT_PATH_COULD_NOT_BE_FETCHED);
        }
    }

    public getUsername(): string | null {
        return this.username;
    }

    public getEnvironmentPath(): string | null {
        return this.environmentPath;
    }

    public getMessageBus(): MessageBus<EnvironmentServiceMessages> {
        return this.messageBus;
    }
}

export const environmentService = new EnvironmentService();

export const useEnvironmentService = (): {username: string | null; environmentPath: string | null} => {
    const [username, setUsername] = React.useState<string | null>(environmentService.getUsername());
    const [environmentPath, setEnvironmentPath] = React.useState<string | null>(
        environmentService.getEnvironmentPath()
    );

    React.useEffect(() => {
        const handleUsernameChange = (
            payload: EnvironmentServiceMessages[EnvironmentServiceTopics.USERNAME_CHANGED]
        ) => {
            setUsername(payload.username);
        };

        const unsubscribeFunc = environmentService
            .getMessageBus()
            .subscribe(EnvironmentServiceTopics.USERNAME_CHANGED, handleUsernameChange);

        return unsubscribeFunc;
    }, []);

    React.useEffect(() => {
        const handleEnvironmentPathChange = (
            payload: EnvironmentServiceMessages[EnvironmentServiceTopics.ENVIRONMENT_PATH_CHANGED]
        ) => {
            setEnvironmentPath(payload.environmentPath);
        };

        const unsubscribeFunc = environmentService
            .getMessageBus()
            .subscribe(EnvironmentServiceTopics.ENVIRONMENT_PATH_CHANGED, handleEnvironmentPathChange);

        return unsubscribeFunc;
    }, []);

    return {username, environmentPath};
};
