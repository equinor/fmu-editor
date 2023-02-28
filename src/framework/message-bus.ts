export interface IMessageBusMessage {
    [type: string]: Record<string, any> | null;
}

type SubscribersMap<T extends IMessageBusMessage, K extends keyof T> = Record<K, Set<(payload?: T[K]) => void>>;

export class MessageBus<MessageTypes extends IMessageBusMessage> {
    private _subscribers: SubscribersMap<MessageTypes, keyof MessageTypes>;

    constructor() {
        this._subscribers = {} as SubscribersMap<MessageTypes, keyof MessageTypes>;
    }

    public subscribe(
        messageType: keyof MessageTypes,
        handler: (payload?: MessageTypes[keyof MessageTypes]) => void
    ): () => void {
        if (!this._subscribers[messageType]) {
            this._subscribers[messageType] = new Set();
        }
        this._subscribers[messageType].add(handler);

        return () => this.unsubscribe(messageType, handler);
    }

    public unsubscribe(
        messageType: keyof MessageTypes,
        handler: (payload?: MessageTypes[keyof MessageTypes]) => void
    ): void {
        if (this._subscribers[messageType]) {
            this._subscribers[messageType].delete(handler);
        }
    }

    public publish(messageType: string, payload?: MessageTypes[keyof MessageTypes]): void {
        if (this._subscribers[messageType]) {
            this._subscribers[messageType].forEach(handler => handler(payload));
        }
    }
}
