var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import { TypedEventEmitter } from '@libp2p/interface';
import { DIRECT_MESSAGE_PROTOCOL, MIME_TEXT_PLAIN } from "./constants.js";
import { serviceCapabilities, serviceDependencies } from '@libp2p/interface';
import { dm } from "./protobuf/direct-message.js";
import { pbStream } from 'it-protobuf-stream';
export const dmClientVersion = '0.0.1';
export const directMessageEvent = 'message';
const ERRORS = {
    EMPTY_MESSAGE: 'Message cannot be empty',
    NO_CONNECTION: 'Failed to create connection',
    NO_STREAM: 'Failed to create stream',
    NO_RESPONSE: 'No response received',
    NO_METADATA: 'No metadata in response',
    STATUS_NOT_OK: (status) => `Received status: ${status}, expected OK`,
};
export class DirectMessage extends TypedEventEmitter {
    constructor(components) {
        super();
        this[_a] = [
            '@libp2p/identify',
            '@libp2p/connection-encryption',
            '@libp2p/transport',
            '@libp2p/stream-multiplexing',
        ];
        this[_b] = ['@universal-connectivity/direct-message'];
        this.dmPeers = new Set();
        this.components = components;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.topologyId = yield this.components.registrar.register(DIRECT_MESSAGE_PROTOCOL, {
                onConnect: this.handleConnect.bind(this),
                onDisconnect: this.handleDisconnect.bind(this),
            });
        });
    }
    afterStart() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.components.registrar.handle(DIRECT_MESSAGE_PROTOCOL, (_c) => __awaiter(this, [_c], void 0, function* ({ stream, connection }) {
                yield this.receive(stream, connection);
            }));
        });
    }
    stop() {
        if (this.topologyId != null) {
            this.components.registrar.unregister(this.topologyId);
        }
    }
    handleConnect(peerId) {
        this.dmPeers.add(peerId.toString());
    }
    handleDisconnect(peerId) {
        this.dmPeers.delete(peerId.toString());
    }
    isDMPeer(peerId) {
        return this.dmPeers.has(peerId.toString());
    }
    send(peerId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message) {
                throw new Error(ERRORS.EMPTY_MESSAGE);
            }
            let stream;
            try {
                // openConnection will return the current open connection if it already exists, or create a new one
                const conn = yield this.components.connectionManager.openConnection(peerId, { signal: AbortSignal.timeout(5000) });
                if (!conn) {
                    throw new Error(ERRORS.NO_CONNECTION);
                }
                // Single protocols can skip full negotiation
                const stream = yield conn.newStream(DIRECT_MESSAGE_PROTOCOL, {
                    negotiateFully: false,
                });
                if (!stream) {
                    throw new Error(ERRORS.NO_STREAM);
                }
                const datastream = pbStream(stream);
                const req = {
                    content: message,
                    type: MIME_TEXT_PLAIN,
                    metadata: {
                        clientVersion: dmClientVersion,
                        timestamp: BigInt(Date.now()),
                    },
                };
                const signal = AbortSignal.timeout(5000);
                yield datastream.write(req, dm.DirectMessageRequest, { signal });
                const res = yield datastream.read(dm.DirectMessageResponse, { signal });
                if (!res) {
                    throw new Error(ERRORS.NO_RESPONSE);
                }
                if (!res.metadata) {
                    throw new Error(ERRORS.NO_METADATA);
                }
                if (res.status !== dm.Status.OK) {
                    throw new Error(ERRORS.STATUS_NOT_OK(res.status));
                }
            }
            catch (e) {
                stream === null || stream === void 0 ? void 0 : stream.abort(e);
                throw e;
            }
            finally {
                try {
                    yield (stream === null || stream === void 0 ? void 0 : stream.close({
                        signal: AbortSignal.timeout(5000),
                    }));
                }
                catch (err) {
                    stream === null || stream === void 0 ? void 0 : stream.abort(err);
                    throw err;
                }
            }
            return true;
        });
    }
    receive(stream, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const datastream = pbStream(stream);
                const signal = AbortSignal.timeout(5000);
                const req = yield datastream.read(dm.DirectMessageRequest, { signal });
                const res = {
                    status: dm.Status.OK,
                    metadata: {
                        clientVersion: dmClientVersion,
                        timestamp: BigInt(Date.now()),
                    },
                };
                yield datastream.write(res, dm.DirectMessageResponse, { signal });
                const detail = {
                    content: req.content,
                    type: req.type,
                    stream: stream,
                    connection: connection,
                };
                this.dispatchEvent(new CustomEvent(directMessageEvent, { detail }));
            }
            catch (e) {
                stream === null || stream === void 0 ? void 0 : stream.abort(e);
                throw e;
            }
            finally {
                try {
                    yield (stream === null || stream === void 0 ? void 0 : stream.close({
                        signal: AbortSignal.timeout(5000),
                    }));
                }
                catch (err) {
                    stream === null || stream === void 0 ? void 0 : stream.abort(err);
                    throw err;
                }
            }
        });
    }
}
_a = serviceDependencies, _b = serviceCapabilities;
export function directMessage() {
    return (components) => {
        return new DirectMessage(components);
    };
}
//# sourceMappingURL=direct-message.js.map