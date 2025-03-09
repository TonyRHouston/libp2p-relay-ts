import { Libp2pType } from "./src/lib/constants";
import { Multiaddr } from "@multiformats/multiaddr";

declare module 'ts-relay' {
  export type { Libp2pType };
  export function startRelay(): Promise<Libp2pType>;
  export function trimAddresses(list: Multiaddr[]): string[];
  }
