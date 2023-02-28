import {Close} from "@mui/icons-material";
import {AlertColor, Button, IconButton} from "@mui/material";
import {notificationsService} from "@services/notifications-service";

import React from "react";

import {NotificationType} from "@shared-types/notifications";

import {SnackbarKey, useSnackbar} from "notistack";

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

const autoHideDuration = 6000;

const makeActions = (
    closeSnackbar: (snackbarId: SnackbarKey) => void,
    action?: NotificationAction
): ((snackbarId: number) => React.ReactNode) => {
    const close = (snackbarId: SnackbarKey) => (
        <IconButton size="small" aria-label="close" color="inherit" onClick={() => closeSnackbar(snackbarId)}>
            <Close fontSize="small" />
        </IconButton>
    );

    if (!action) return close;

    return (snackbarId: number) => (
        <>
            <Button color="secondary" size="small" onClick={() => action.action}>
                {action.label}
            </Button>
            {close(snackbarId)}
        </>
    );
};

export const NotificationsProvider: React.FC = props => {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();

    React.useEffect(() => {
        const unsubscribeFunc = notificationsService.subscribe(payload => {
            enqueueSnackbar(payload.message, {
                variant: notificationTypeMap[payload.type],
                action: makeActions(closeSnackbar, payload.action),
                autoHideDuration,
            });
        });

        return unsubscribeFunc;
    }, [enqueueSnackbar, closeSnackbar]);

    return <>{props.children}</>;
};
