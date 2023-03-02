import {MessageBus, MessageBusMessage} from "@src/framework/message-bus";

export class ServiceBase<ServiceMassages extends MessageBusMessage> {
    protected messageBus: MessageBus<ServiceMassages>;

    constructor() {
        this.messageBus = new MessageBus<ServiceMassages>();
    }

    public getMessageBus() {
        return this.messageBus;
    }
}
