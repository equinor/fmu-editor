export type MessageBusMessage = {
    [type: string]: Record<string, any> | null;
};

type SubscribersMap<T extends MessageBusMessage, K extends keyof T> = Record<K, Set<(payload: T[K]) => void>>;

export class MessageBus<
    MessageTypes extends MessageBusMessage,
    Topics extends keyof MessageTypes = keyof MessageTypes
> {
    private _subscribers: SubscribersMap<MessageTypes, Topics>;
    private _messageCache: Record<Topics, MessageTypes[Topics]>;

    constructor() {
        this._subscribers = {} as SubscribersMap<MessageTypes, Topics>;
        this._messageCache = {} as Record<Topics, MessageTypes[Topics]>;
    }

    public subscribe<Topic extends Topics>(
        topic: Topic,
        handler: (payload: MessageTypes[Topic]) => void,
        callHandlerAfterInit?: boolean
    ): () => void {
        if (!this._subscribers[topic]) {
            this._subscribers[topic] = new Set();
        }
        this._subscribers[topic].add(handler as (payload: MessageTypes[Topics]) => void);

        if (callHandlerAfterInit && this._messageCache[topic]) {
            handler(this._messageCache[topic] as MessageTypes[Topic]);
        }

        return () => this.unsubscribe(topic, handler);
    }

    public unsubscribe<Topic extends Topics>(
        messageType: Topic,
        handler: (payload?: MessageTypes[Topic]) => void
    ): void {
        if (this._subscribers[messageType]) {
            this._subscribers[messageType].delete(handler as (payload: MessageTypes[Topics]) => void);
        }
    }

    public publish(messageType: string, payload?: MessageTypes[Topics]): void {
        if (this._messageCache[messageType]) {
            this._messageCache[messageType] = payload;
        }
        if (this._subscribers[messageType]) {
            this._subscribers[messageType].forEach((handler: (payload: MessageTypes[Topics]) => void) =>
                handler(payload)
            );
        }
    }
}
