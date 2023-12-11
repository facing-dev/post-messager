interface RawMessage<T> {
    type: "Message"
    data: T
}
interface RawDown {
    type: "Done"
    doneId: string
}
type Raw<T> = (RawMessage<T> | RawDown) & {
    __byPM: true
    timestamp: number
    id: string
}

function generateId() {
    return `${Date.now()}-${Math.random()}`
}

export default class PostMessager<T> {
    #listenerHandler: ((event: MessageEvent) => void) | null = null
    #targetOrigin = '*'
    #target: Window
    #doneMap: Map<string, {
        res: Function
        rej: Function
    }> = new Map
    #doneTimeout: number
    get doneMapSize(){
        return this.#doneMap.size
    }
    constructor(opt: {
        targetOrigin?: string
        target: Window
        doneTimeout?: number
        handler: (data: T, done: Function) => void
        rawHandler?: (data: Raw<T>, done: Function) => void
    }) {
        this.#target = opt.target
        this.#targetOrigin = opt?.targetOrigin ?? '*'
        this.#doneTimeout = opt.doneTimeout ?? 5000
        this.#listenerHandler = (event) => {

            if (event.origin !== this.#targetOrigin && this.#targetOrigin !== '*') {
                return
            }
            if (event.data.__byPM !== true) {
                return
            }

            const rawData = event.data as Raw<T>
            // const rawData = JSON.parse(event.data) as Raw<T>
            if (rawData.type === 'Message') {
                const doneCb = () => {
                    this.#post({
                        type: 'Done',
                        doneId: rawData.id,
                    })
                }
                opt.rawHandler?.(rawData, doneCb)
                opt.handler(rawData.data, doneCb)
            }
            if (rawData.type === 'Done') {
                this.#doneMap.get(rawData.doneId)?.res()
            }
        }
        window.addEventListener('message', this.#listenerHandler)
    }
    #post(raw: RawMessage<T> | RawDown, id = generateId(), timestamp = Date.now()) {
        const message: Raw<T> = {
            ...raw,
            id,
            timestamp,
            __byPM: true
        }
        this.#target.postMessage(message, this.#targetOrigin)
    }
    post(data: T, promise?: false): void
    post(data: T, promise: true): Promise<void>
    post(data: T, promise?: boolean): Promise<void> | void {
        const id = generateId()
        const timestamp = Date.now()
        const p = promise ? new Promise<void>((res, rej) => {
            const timeout = setTimeout(() => {
                this.#doneMap.get(id)?.rej()
            }, this.#doneTimeout);
            this.#doneMap.set(id, {
                res: () => {
                    clearTimeout(timeout)
                    this.#doneMap.delete(id)
                    res()
                },
                rej: () => {
                    this.#doneMap.delete(id)
                    rej(`message timeout id: ${id}`)
                }
            })
        }) : undefined
        this.#post({
            type: 'Message',
            data: data
        }, id, timestamp)
        return p
    }
    release() {
        if (this.#listenerHandler) {
            window.removeEventListener('message', this.#listenerHandler)
        }
    }
}