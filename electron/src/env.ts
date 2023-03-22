import {app} from "electron";

export const IS_DEV = !app.isPackaged;
export const NO_MSAL = process.argv.includes("--deactivate-msal");
export const MSAL_PERSISTENCE = process.argv.includes("--msal-persistence");
