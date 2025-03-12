import { Libp2pType } from "./index.ts";
import { Multiaddr } from "@multiformats/multiaddr";

declare module 'libp2p-ts' {
  export type { Libp2pType };
  export function startRelay(): Promise<Libp2pType>;
  export function trimAddresses(list: Multiaddr[]): string[];
  }
