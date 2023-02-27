export interface IBusMessage {
    type: string;
    data: any;
}

export class MessageBus {
    private _messageHandlers: { [messageType: string]: Function[] };

    constructor() {
        this._messageHandlers = {};
    }
    
    public subscribe(messageType: string, handler: Function) {
        if (!this._messageHandlers[messageType]) {
            this._messageHandlers[messageType] = [];
        }
    
        this._messageHandlers[messageType].push(handler);
    }
    
    public publish(messageType: string, message: any) {
        if (this._messageHandlers[messageType]) {
            this._messageHandlers[messageType].forEach(handler => handler(message));
        }
    }
}
