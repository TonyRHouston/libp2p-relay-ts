import type { Libp2p, PubSub } from "@libp2p/interface";
import type { Identify } from "@libp2p/identify";
import type { DirectMessage } from "./direct-message.ts";
import type { DelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import type { Multiaddr } from "@multiformats/multiaddr";
export declare const CHAT_TOPIC = "universal-connectivity";
export declare const CHAT_FILE_TOPIC = "universal-connectivity-file";
export declare const PUBSUB_PEER_DISCOVERY = "universal-connectivity-browser-peer-discovery";
export declare const FILE_EXCHANGE_PROTOCOL = "/universal-connectivity-file/1";
export declare const DIRECT_MESSAGE_PROTOCOL = "/universal-connectivity/dm/1.0.0";
export declare const CIRCUIT_RELAY_CODE = 290;
export declare const MIME_TEXT_PLAIN = "text/plain";
export type Libp2pType = Libp2p<{
    pubsub?: PubSub;
    identify: Identify;
    directMessage: DirectMessage;
    delegatedRouting?: DelegatedRoutingV1HttpApiClient;
}>;
export declare function trimAddresses(list: Multiaddr[]): string[];
export declare function random(len: number): string;
export declare function r(max: number): number;
//# sourceMappingURL=constants.d.ts.map