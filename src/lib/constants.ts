import type { Libp2p, PubSub } from "@libp2p/interface";
import type { Identify } from "@libp2p/identify";
import type { DirectMessage } from "./direct-message.ts";
import type { DelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import type { Multiaddr } from "@multiformats/multiaddr";

export const CHAT_TOPIC = "universal-connectivity";
export const CHAT_FILE_TOPIC = "universal-connectivity-file";
export const PUBSUB_PEER_DISCOVERY =
  "universal-connectivity-browser-peer-discovery";
export const FILE_EXCHANGE_PROTOCOL = "/universal-connectivity-file/1";
export const DIRECT_MESSAGE_PROTOCOL = "/universal-connectivity/dm/1.0.0";

export const CIRCUIT_RELAY_CODE = 290;

export const MIME_TEXT_PLAIN = "text/plain";

// 👇 App specific dedicated bootstrap PeerIDs
// Their multiaddrs are ephemeral so peer routing is used to resolve multiaddr
export const WEBTRANSPORT_BOOTSTRAP_PEER_ID =
  "12D3KooWFhXabKDwALpzqMbto94sB7rvmZ6M28hs9Y9xSopDKwQr";

export const BOOTSTRAP_PEER_IDS = [WEBTRANSPORT_BOOTSTRAP_PEER_ID];
export type Libp2pType = Libp2p<{
  pubsub?: PubSub;
  identify: Identify;
  directMessage: DirectMessage;
  delegatedRouting?: DelegatedRoutingV1HttpApiClient;
}>;

export function trimAddresses(list: Multiaddr[]): string[] {
  const op: string[] = [];
  for (const addr of list) {
    const str = addr.toString();
    if (!str.includes("127.0.0.1")) {
      op.push(str);
    }
  }
  return op;
}
