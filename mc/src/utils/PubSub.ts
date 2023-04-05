interface IPubSubBeforeAfterMessage {
    before: any,
    after: any
}

class PubSub {

    private handlers: { [key: string]: Function[] } = {}

    public subscribe(
        event: string,
        callback: (message: any) => void // TODO : Check any
    ) {
        const list = this.handlers[event] ?? []
        list.push(callback)
        this.handlers[event] = list

        return callback
    }

    public unsubscribe(
        event: string,
        callback: (message: any) => void
    ) {
        let list = this.handlers[event] ?? []
        list = list.filter(h => h !== callback)
        this.handlers[event] = list
    }

    public publish(
        event: string,
        message: any
    ) {
        if (typeof this.handlers[event] !== 'undefined') {
            this.handlers[event].forEach(h => h(message))
        }
    }

}

export { PubSub, IPubSubBeforeAfterMessage }