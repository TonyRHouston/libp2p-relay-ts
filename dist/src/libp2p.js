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
import { clientManager } from "../index.js";
import { random, generateKeys, decrypt, trimAddresses } from "./func.js";
let prvKey;
let pubKey;
const configPath = path.join(process.cwd(), "config.json");
if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    prvKey = config.prvKey;
    pubKey = config.pubKey;
    console.log("Key loaded from config.json");
}
else {
    prvKey = random(64);
    pubKey = (await generateKeys(prvKey)).publicKey;
    fs.writeFileSync(configPath, JSON.stringify({ prvKey, pubKey }));
    console.log("Key generated and saved to config.json. PROTECT YOUR PRIVATE KEY (prvKey)!");
}
export async function startRelay() {
    const node = await createLibp2p({
        privateKey: await generateKeyPairFromSeed("Ed25519", Buffer.from(prvKey, "hex")),
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
            ClientManager: clientManager(),
        }
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
        console.log("result from Map removal: ", libp2p.services.ClientManager.remove(detail.toString()));
        console.log("Disconnected from: ", detail);
    });
    libp2p.addEventListener("peer:connect", async (event) => {
        const { detail } = event;
        const _handshake = await handshake(libp2p, detail);
        if (!_handshake)
            libp2p.getConnections(detail).forEach((connection) => {
                connection.close().then().catch();
            });
    });
    //Project relay does not seek peers.
    // libp2p.addEventListener("peer:discovery", async (event) => {
    //   const { detail } = event;
    //   console.log("Discovered peer: ", detail);
    //   // await handshake(libp2p, detail.id);
    // });
    libp2p.services.directMessage.addEventListener("message", async (event) => await handleMessaging(event));
}
async function handshake(libp2p, peerId) {
    const { privateKey, publicKey } = await generateKeys();
    await libp2p.services.directMessage.send(peerId, publicKey, "handshake");
    // Wait for a response and print it to the console.
    const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(false), 6000);
        libp2p.services.directMessage.addEventListener("message", async function handler(event) {
            const { detail } = event;
            if (detail.type == "handshake-response" &&
                detail.connection.remotePeer.equals(peerId)) {
                libp2p.services.directMessage.removeEventListener("message", handler);
                const json = JSON.parse(await decrypt(privateKey, detail.content));
                if (json.multiAddrs && json.type) {
                    libp2p.services.ClientManager.add(detail.connection.remotePeer.toString(), {
                        multiAddr: [...trimAddresses(json.multiAddrs)],
                        type: json.type,
                        pubKey: publicKey,
                        prvKey: privateKey,
                    });
                    clearTimeout(timeout);
                    resolve(true);
                }
                else {
                    clearTimeout(timeout);
                    resolve(false);
                }
            }
        });
    });
    return response;
}
async function handleMessaging(event) {
    const { detail } = event;
    const { connection, content, type } = detail;
    const peerId = connection.remotePeer.toString();
    console.log(`${new Date().toISOString()}📬 Direct Message of type ${type} from ${peerId} at ${connection.remoteAddr} Contents: ${content}`);
    switch (type) {
    }
}
//# sourceMappingURL=libp2p.js.map