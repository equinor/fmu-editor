type PayloadMap<
    M extends {
        [index: string]: {[key: string]: any};
    }
> = {
    [K in keyof M]: M[K] extends undefined
        ? {
              type: K;
          }
        : {
              type: K;
              payload: M[K];
          };
};

export class Webworker<
    Requests extends {[index: string]: {[key: string]: any}},
    Responses extends {[index: string]: {[key: string]: any}}
> {
    private listeners: {[key in keyof Responses]: (payload: Responses[key]) => void};
    private messageLog: string[];
    // eslint-disable-next-line no-restricted-globals
    private worker: any;
    constructor(Worker?: any) {
        this.listeners = {} as {[key in keyof Responses]: (payload: Responses[key]) => void};
        this.messageLog = [];

        if (Worker) {
            this.worker = new Worker();
            this.worker.onmessage = (event: MessageEvent<PayloadMap<Responses>[keyof PayloadMap<Responses>]>) => {
                const listener = this.listeners[event.data.type];
                if (listener) {
                    if ("payload" in event.data) {
                        listener(event.data.payload);
                    }
                }
            };
        } else {
            // eslint-disable-next-line no-restricted-globals
            this.worker = self;
            // eslint-disable-next-line no-restricted-globals
            self.addEventListener(
                "message",
                (event: MessageEvent<PayloadMap<Responses>[keyof PayloadMap<Responses>]>) => {
                    const listener = this.listeners[event.data.type];
                    if (listener) {
                        if ("payload" in event.data) {
                            listener(event.data.payload);
                        }
                    }
                }
            );
        }
    }

    public on<K extends keyof Responses>(type: K, callback: (payload: Responses[K]) => void): void {
        this.listeners[type] = callback;
    }

    public postMessage(type: keyof Requests, payload?: Requests[keyof Requests]): void {
        this.messageLog = [...this.messageLog, type as string];

        // eslint-disable-next-line no-restricted-globals
        self.postMessage({type: type as string, payload});
    }
}
