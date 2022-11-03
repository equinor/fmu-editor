import {AlertColor} from "@mui/material";

export enum NotificationType {
    ERROR = 0,
    WARNING,
    INFORMATION,
    SUCCESS,
}

export const notificationTypeMap: {[key: number]: AlertColor} = {
    [NotificationType.ERROR]: "error",
    [NotificationType.WARNING]: "warning",
    [NotificationType.INFORMATION]: "info",
    [NotificationType.SUCCESS]: "success",
};

export type NotificationAction = {
    label: string;
    action: () => void;
};

export type Notification = {
    type: NotificationType;
    message: string;
    action?: NotificationAction;
};

export type NotificationsState = {
    notifications: Notification[];
};
