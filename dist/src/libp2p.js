import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { tcp } from "@libp2p/tcp";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { directMessage } from "./direct-message.js";
import { identify } from "@libp2p/identify";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { webSockets } from "@libp2p/websockets";
import fs from "fs";
import path from "path";
import { random } from "./constants.js";
let key;
const configPath = path.join(process.cwd(), "config.json");
if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    key = config.key;
}
else {
    key = random(64);
    fs.writeFileSync(configPath, JSON.stringify({ key }, null, 2));
    console.log("Key generated and saved to config.json");
}
const prvKey = generateKeyPairFromSeed("Ed25519", Buffer.from(key, "hex"));
export async function startRelay() {
    const node = await createLibp2p({
        privateKey: await prvKey,
        addresses: {
            listen: ["/ip4/0.0.0.0/tcp/9090", "/ip4/0.0.0.0/tcp/9089/ws"],
        },
        transports: [tcp(), webSockets()],
        streamMuxers: [yamux()],
        connectionEncrypters: [noise()],
        services: {
            relay: circuitRelayServer(),
            identify: identify(),
            directMessage: directMessage(),
        },
    });
    await node.start();
    await node.services.directMessage.start();
    await handleEvents(node);
    process.on("SIGTERM", async () => {
        await node.stop();
        process.exit(0);
    });
    process.on("SIGINT", async () => {
        await node.stop();
        process.exit(0);
    });
    process.on("exit", async () => {
        await node.stop();
        process.exit(0);
    });
    process.on("uncaughtException", async (err) => {
        console.error("Uncaught Exception:", err);
        await node.stop();
        process.exit(1);
    });
    process.on("unhandledRejection", async (reason) => {
        console.error("Unhandled Rejection:", reason);
        await node.stop();
        process.exit(1);
    });
    process.on("SIGUSR2", async () => {
        await node.stop();
        console.log("SIGUSR2 received, stopping...");
        process.exit(0);
    });
    process.on("SIGUSR1", async () => {
        console.log("SIGUSR1 received, stopping...");
        await node.stop();
        // Stop the node
        console.log("Node stopped");
        process.exit(0);
    });
    process.on("SIGBREAK", async () => {
        console.log("SIGBREAK received, stopping...");
        await node.stop();
        // Stop the node
        console.log("Node stopped");
        process.exit(0);
    });
    process.on("SIGQUIT", async () => {
        console.log("SIGQUIT received, stopping...");
        await node.stop();
        // Stop the node
        console.log("Node stopped");
        process.exit(0);
    });
    return node;
}
async function handleEvents(libp2p) {
    libp2p.addEventListener("peer:disconnect", (event) => {
        const { detail } = event;
        console.log("Disconnected from: ", detail);
    });
    libp2p.addEventListener("peer:connect", async (event) => {
        const { detail } = event;
        console.log("Connected to: ", detail);
        await handshake(libp2p, detail);
    });
    libp2p.addEventListener("peer:discovery", async (event) => {
        const { detail } = event;
        console.log("Discovered peer: ", detail);
        // await handshake(libp2p, detail.id);
    });
}
async function handshake(libp2p, peerId) {
    // Enhanced direct message handling
    libp2p.services.directMessage.addEventListener("message", (event) => handleMessaging(event));
    libp2p.services.directMessage.send(peerId, "hey");
    return true;
}
async function handleMessaging(event) {
    const { detail } = event;
    const { connection, content, type } = detail;
    const peerId = connection.remotePeer.toString();
    console.log(`${new Date().toISOString()}📬 Direct Message of type ${type} from ${peerId} at ${connection.remoteAddr} Contents: ${content}`);
    const { privateKey, publicKey } = await generateKeys();
    const data = await encrypt(publicKey, "ahahahahah");
    const decrypted = await decrypt(privateKey, data);
    console.log(data, " :NEXT: ", decrypted);
    switch (content) {
    }
}
import pkg from "elliptic";
const { ec } = pkg;
const _ec = new ec("secp256k1");
export async function generateKeys() {
    const privateKey = random(32);
    console.log("Private Key: ", privateKey);
    const keyPair = _ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, "hex").slice(2);
    return {
        //Get public key (uncompressed format, without the prefix 04)
        privateKey,
        publicKey,
    };
}
import { encrypt as e, decrypt as d } from "eciesjs";
export async function encrypt(pubKey, _in) {
    const messageBytes = new TextEncoder().encode(_in);
    // Encryption
    return e(pubKey, messageBytes).toString("hex");
}
export async function decrypt(prvKey, _in) {
    const array = await hexToUint8Array(_in);
    const decryptedBytes = Buffer.from(d(prvKey, array));
    return new TextDecoder().decode(decryptedBytes);
}
export async function hexToUint8Array(hexString) {
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
//# sourceMappingURL=libp2p.js.map