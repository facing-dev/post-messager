interface RawMessage<T> {
    type: "Message";
    data: T;
}
interface RawDown {
    type: "Done";
    doneId: string;
    data: any;
}
type Raw<T> = (RawMessage<T> | RawDown) & {
    __byPM: true;
    timestamp: number;
    id: string;
};
export default class PostMessager<T> {
    #private;
    get doneMapSize(): number;
    constructor(opt: {
        targetOrigin?: string;
        target: Window;
        doneTimeout?: number;
        handler: (data: T, done: Function) => void;
        rawHandler?: (data: Raw<T>, done: Function) => void;
    });
    post(data: T, promise?: false): void;
    post<PT = void>(data: T, promise: true): Promise<PT>;
    release(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map