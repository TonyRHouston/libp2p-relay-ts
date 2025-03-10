import { Libp2pType } from "./constants.ts";
export declare function startRelay(): Promise<Libp2pType>;
export declare function generateKeys(): Promise<{
    privateKey: string;
    publicKey: string;
}>;
export declare function encrypt(pubKey: string, _in: string): Promise<string>;
export declare function decrypt(prvKey: string, _in: string): Promise<string>;
export declare function hexToUint8Array(hexString: string): Promise<Uint8Array<ArrayBufferLike>>;
//# sourceMappingURL=libp2p.d.ts.map