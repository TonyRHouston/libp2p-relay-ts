import { encrypt as e, decrypt as d } from "eciesjs";
import type { Multiaddr } from "@multiformats/multiaddr";
import pkg from "elliptic";
const { ec } = pkg;
const _ec = new ec("secp256k1");
import { keccak256 } from "ethereum-cryptography/keccak";
import { bytesToHex } from "ethereum-cryptography/utils";


export async function generateKeys(prvKey: string = ''): Promise<{
  privateKey: string;
  publicKey: string;
}> {

  const privateKey = prvKey !== '' ? prvKey : random(64);
  console.log("Private Key: ", privateKey);
  const keyPair = _ec.keyFromPrivate(privateKey);
  const publicKey = keyPair.getPublic(false, "hex").slice(2);

  return {
    //Get public key (uncompressed format, without the prefix 04)
    privateKey,
    publicKey,
  };
}
export async function encrypt(pubKey: string, _in: string) {
  const messageBytes = new TextEncoder().encode(_in);
  return e(pubKey, messageBytes).toString("hex");
}

export async function decrypt(prvKey: string, _in: string) {
  const array = await hexToUint8Array(_in);
  const decryptedBytes = Buffer.from(d(prvKey, array));
  return new TextDecoder().decode(decryptedBytes);
}

export async function hexToUint8Array(
  hexString: string
): Promise<Uint8Array<ArrayBufferLike>> {
  if (hexString.length % 2 !== 0) {
    throw new Error("Hex string length must be even");
  }

  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    const hexByte = hexString.substring(i, i + 2);
    const byte = parseInt(hexByte, 16);
    byteArray[i / 2] = byte;
  }
  return byteArray;
}

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

export function random(len: number): string {
  let tmp = "";
  let chars = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
  ];

  for (let x = 0; x < len; x++) {
    tmp += chars[r(chars.length)];
  }
  return tmp;
}
export function r(max: number) {
  return Math.floor(Math.random() * max);
}
