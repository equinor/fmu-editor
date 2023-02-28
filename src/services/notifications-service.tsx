import {MessageBus} from "@src/framework/message-bus";

import {Notification} from "@shared-types/notifications";

export enum NotificationMessageTypes {
    NOTIFICATION_ADDED = "NOTIFICATION_ADDED",
}

type NotificationMessages = {
    [NotificationMessageTypes.NOTIFICATION_ADDED]: Notification;
};

class NotificationsService {
    private messageBus: MessageBus<NotificationMessages>;

    constructor() {
        this.messageBus = new MessageBus<NotificationMessages>();
    }

    public publishNotification(notification: Notification): void {
        this.messageBus.publish(NotificationMessageTypes.NOTIFICATION_ADDED, {
            type: notification.type,
            message: notification.message,
            action: notification.action,
        });
    }

    public subscribe(callback: (payload: Notification) => void): () => void {
        return this.messageBus.subscribe(NotificationMessageTypes.NOTIFICATION_ADDED, callback);
    }
}

export const notificationsService = new NotificationsService();
