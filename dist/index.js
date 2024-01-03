"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _PostMessager_instances, _PostMessager_listenerHandler, _PostMessager_targetOrigin, _PostMessager_target, _PostMessager_doneMap, _PostMessager_doneTimeout, _PostMessager_post;
Object.defineProperty(exports, "__esModule", { value: true });
function generateId() {
    return `${Date.now()}-${Math.random()}`;
}
class PostMessager {
    get doneMapSize() {
        return __classPrivateFieldGet(this, _PostMessager_doneMap, "f").size;
    }
    constructor(opt) {
        var _a, _b;
        _PostMessager_instances.add(this);
        _PostMessager_listenerHandler.set(this, null);
        _PostMessager_targetOrigin.set(this, '*');
        _PostMessager_target.set(this, void 0);
        _PostMessager_doneMap.set(this, new Map);
        _PostMessager_doneTimeout.set(this, void 0);
        __classPrivateFieldSet(this, _PostMessager_target, opt.target, "f");
        __classPrivateFieldSet(this, _PostMessager_targetOrigin, (_a = opt === null || opt === void 0 ? void 0 : opt.targetOrigin) !== null && _a !== void 0 ? _a : '*', "f");
        __classPrivateFieldSet(this, _PostMessager_doneTimeout, (_b = opt.doneTimeout) !== null && _b !== void 0 ? _b : 5000, "f");
        __classPrivateFieldSet(this, _PostMessager_listenerHandler, (event) => {
            var _a, _b;
            if (event.origin !== __classPrivateFieldGet(this, _PostMessager_targetOrigin, "f") && __classPrivateFieldGet(this, _PostMessager_targetOrigin, "f") !== '*') {
                return;
            }
            if (event.data.__byPM !== true) {
                return;
            }
            const rawData = event.data;
            // const rawData = JSON.parse(event.data) as Raw<T>
            if (rawData.type === 'Message') {
                const doneCb = (data) => {
                    __classPrivateFieldGet(this, _PostMessager_instances, "m", _PostMessager_post).call(this, {
                        type: 'Done',
                        doneId: rawData.id,
                        data: data
                    });
                };
                (_a = opt.rawHandler) === null || _a === void 0 ? void 0 : _a.call(opt, rawData, doneCb);
                opt.handler(rawData.data, doneCb);
            }
            if (rawData.type === 'Done') {
                (_b = __classPrivateFieldGet(this, _PostMessager_doneMap, "f").get(rawData.doneId)) === null || _b === void 0 ? void 0 : _b.res(rawData.data);
            }
        }, "f");
        window.addEventListener('message', __classPrivateFieldGet(this, _PostMessager_listenerHandler, "f"));
    }
    post(data, promise) {
        const id = generateId();
        const timestamp = Date.now();
        const p = promise ? new Promise((res, rej) => {
            const timeout = setTimeout(() => {
                var _a;
                (_a = __classPrivateFieldGet(this, _PostMessager_doneMap, "f").get(id)) === null || _a === void 0 ? void 0 : _a.rej();
            }, __classPrivateFieldGet(this, _PostMessager_doneTimeout, "f"));
            __classPrivateFieldGet(this, _PostMessager_doneMap, "f").set(id, {
                res: (data) => {
                    clearTimeout(timeout);
                    __classPrivateFieldGet(this, _PostMessager_doneMap, "f").delete(id);
                    res(data);
                },
                rej: () => {
                    __classPrivateFieldGet(this, _PostMessager_doneMap, "f").delete(id);
                    rej(`message timeout id: ${id}`);
                }
            });
        }) : undefined;
        __classPrivateFieldGet(this, _PostMessager_instances, "m", _PostMessager_post).call(this, {
            type: 'Message',
            data: data
        }, id, timestamp);
        return p;
    }
    release() {
        if (__classPrivateFieldGet(this, _PostMessager_listenerHandler, "f")) {
            window.removeEventListener('message', __classPrivateFieldGet(this, _PostMessager_listenerHandler, "f"));
        }
    }
}
_PostMessager_listenerHandler = new WeakMap(), _PostMessager_targetOrigin = new WeakMap(), _PostMessager_target = new WeakMap(), _PostMessager_doneMap = new WeakMap(), _PostMessager_doneTimeout = new WeakMap(), _PostMessager_instances = new WeakSet(), _PostMessager_post = function _PostMessager_post(raw, id = generateId(), timestamp = Date.now()) {
    const message = Object.assign(Object.assign({}, raw), { id,
        timestamp, __byPM: true });
    if (__classPrivateFieldGet(this, _PostMessager_target, "f") === null) {
        throw 'post-messager: target';
    }
    __classPrivateFieldGet(this, _PostMessager_target, "f").postMessage(message, __classPrivateFieldGet(this, _PostMessager_targetOrigin, "f"));
};
exports.default = PostMessager;
//# sourceMappingURL=index.js.map