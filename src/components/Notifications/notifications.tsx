import {Close} from "@mui/icons-material";
import {Alert, AlertColor, Button, IconButton, Snackbar} from "@mui/material";

import React from "react";

import {useAppSelector} from "@redux/hooks";

export enum NotificationType {
    ERROR = 0,
    WARNING,
    INFORMATION,
    SUCCESS,
}

const notificationTypeMap: {[key: number]: AlertColor} = {
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

export const NotificationsProvider: React.FC = props => {
    const [open, setOpen] = React.useState(false);
    const notifications = useAppSelector(
        state => state.notifications.notifications
    );

    React.useEffect(() => {
        setOpen(true);
    }, [notifications]);

    const handleClose = (
        _: Event | React.SyntheticEvent<any, Event>,
        reason?: string
    ) => {
        if (reason === "clickaway") {
            return;
        }

        setOpen(false);
    };

    const lastNotification = notifications[notifications.length - 1];
    const close = (
        <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
        >
            <Close fontSize="small" />
        </IconButton>
    );
    const action =
        lastNotification && lastNotification.action ? (
            <>
                <Button
                    color="secondary"
                    size="small"
                    onClick={lastNotification.action.action}
                >
                    {lastNotification.action.label}
                </Button>
                {close}
            </>
        ) : (
            close
        );

    return (
        <>
            {props.children}
            {lastNotification && (
                <Snackbar
                    autoHideDuration={6000}
                    open={open}
                    anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                    onClose={handleClose}
                >
                    <Alert
                        severity={notificationTypeMap[lastNotification.type]}
                    >
                        {lastNotification.message}
                        {action}
                    </Alert>
                </Snackbar>
            )}
        </>
    );
};
