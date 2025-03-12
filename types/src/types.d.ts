import type { Libp2p, PubSub } from "@libp2p/interface";
import type { Identify } from "@libp2p/identify";
import type { DirectMessage } from "./direct-message.ts";
import type { DelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import { ClientManager } from "./ClientManager.ts";
export type Libp2pType = Libp2p<{
    pubsub?: PubSub;
    identify: Identify;
    directMessage: DirectMessage;
    delegatedRouting?: DelegatedRoutingV1HttpApiClient;
    ClientManager: ClientManager;
}>;
export type PeerObject = {
    multiAddr: string[];
    type: string;
    pubKey: string;
    prvKey: string;
};
//# sourceMappingURL=types.d.ts.map