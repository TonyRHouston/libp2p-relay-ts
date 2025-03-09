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


export function random (len: number, hex: boolean = false, leading: boolean = false): string {
  let tmp = '';
  let chars =  ['a', 'b', 'c', 'd', 'e', 'f', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  if(hex && leading)
  {
    tmp += '0x'
  }else {
  chars = ['g', 'h', 'i', 'j',  'k', 'l', 'm','n', 'o', 'p', 'q', 'r', 's', 't', 'u','v', 'w', 'x','y','z','!' , "@", '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '~', '`', '{', '}', '[', ']', '|', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/', ...chars ];
  }
  for (let x = 0; x < len; x++) {
      tmp += chars[r(chars.length)]
  }
  return tmp;
}
export function r(max: number) {
  return Math.floor(Math.random() * max);
}