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
import { DIRECT_MESSAGE_PROTOCOL, ERRORS } from "../index.js";
import { random, generateKeys, encrypt, decrypt } from "./func.js";
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
    await libp2p.services.directMessage.send(peerId, publicKey);
    // openConnection will return the current open connection if it already exists, or create a new one
    const conn = libp2p.getConnections(peerId)[0];
    if (!conn) {
        throw new Error(ERRORS.NO_CONNECTION);
    }
    // Single protocols can skip full negotiation
    const stream = await conn.newStream(DIRECT_MESSAGE_PROTOCOL, {
        negotiateFully: false,
    });
    if (!stream) {
        throw new Error(ERRORS.NO_STREAM);
    }
    const response = await new Promise((resolve, reject) => {
        libp2p.services.directMessage.receive(stream, libp2p.getConnections(peerId)[0])
            .then(resolve)
            .catch(reject);
    });
    // console.log(stream)
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
//# sourceMappingURL=libp2p.js.map