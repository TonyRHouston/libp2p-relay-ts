import type { Libp2p, PubSub } from "@libp2p/interface";
import type { Identify } from "@libp2p/identify";
import type { DirectMessage } from "./src/direct-message.ts";
import type { DelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";

export * from "./src/constants.ts";
export * from "./src/libp2p.ts";
export * from "./src/direct-message.ts"
export * from "./src/func.ts";
export * from "./src/protobuf/direct-message.ts"
export type Libp2pType = Libp2p<{
    pubsub?: PubSub;
    identify: Identify;
    directMessage: DirectMessage;
    delegatedRouting?: DelegatedRoutingV1HttpApiClient;
  }>;