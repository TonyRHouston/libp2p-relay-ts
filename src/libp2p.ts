import { createLibp2p } from "libp2p";
import { PeerId, Stream } from "@libp2p/interface";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { tcp } from "@libp2p/tcp";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { directMessage, DirectMessageEvent } from "./direct-message.ts";
import { identify } from "@libp2p/identify";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { webSockets } from "@libp2p/websockets";
import fs from "fs";
import path from "path";
import { Libp2pType, DIRECT_MESSAGE_PROTOCOL, ERRORS } from "../index.ts";
import { random, generateKeys, encrypt, decrypt } from "./func.ts";
let prvKey: string;
let pubKey: string;
const configPath = path.join(process.cwd(), "config.json");

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  prvKey = config.prvKey;
  pubKey = config.pubKey;
  console.log("Key loaded from config.json");
} else {
  prvKey = random(64);
  pubKey = (await generateKeys(prvKey)).publicKey;
  fs.writeFileSync(configPath, JSON.stringify({ prvKey, pubKey }));
  console.log(
    "Key generated and saved to config.json. PROTECT YOUR PRIVATE KEY (prvKey)!"
  );
}

export async function startRelay(): Promise<Libp2pType> {
  const node = await createLibp2p({
    privateKey: await generateKeyPairFromSeed(
      "Ed25519",
      Buffer.from(prvKey, "hex")
    ),
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

async function handleEvents(libp2p: Libp2pType) {
  libp2p.addEventListener("peer:disconnect", (event) => {
    const { detail } = event;

    console.log("Disconnected from: ", detail);
  });

  libp2p.addEventListener("peer:connect", async (event) => {
    const { detail } = event;

    console.log("Connected to: ", detail);
    console.log(await handshake(libp2p, detail));
  });

  //Project relay does not seek peers.
  // libp2p.addEventListener("peer:discovery", async (event) => {
  //   const { detail } = event;

  //   console.log("Discovered peer: ", detail);
  //   // await handshake(libp2p, detail.id);
  // });
  libp2p.services.directMessage.addEventListener(
    "message",
    async (event) => await handleMessaging(event)
  );
}

async function handshake(libp2p: Libp2pType, peerId: PeerId): Promise<boolean> {
  const { privateKey, publicKey } = await generateKeys();
  await libp2p.services.directMessage.send(peerId, publicKey, "handshake");
  // Wait for a response and print it to the console.
  const response = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => resolve("Handshake timeout"), 6000);
    let response: string | null = null;
    libp2p.services.directMessage.addEventListener(
      "message",
      function handler(event) {
        const { detail } = event;
        if (detail.connection.remotePeer.equals(peerId)) {
          response = detail.content;
          console.log("Received handshake response: ", response);
          libp2p.services.directMessage.removeEventListener("message", handler);
          clearTimeout(timeout);
          resolve(detail.content);
        }
      }
    );
  });

  return response !== "Handshake timeout";
}

async function handleMessaging(
  event: CustomEvent<DirectMessageEvent>
): Promise<void> {
  const { detail } = event;
  const { connection, content, type } = detail;
  const peerId = connection.remotePeer.toString();

  console.log(
    `${new Date().toISOString()}📬 Direct Message of type ${type} from ${peerId} at ${
      connection.remoteAddr
    } Contents: ${content}`
  );
  const { privateKey, publicKey } = await generateKeys();
  const data = await encrypt(publicKey, "ahahahahah");
  const decrypted = await decrypt(privateKey, data);
  console.log(data, " :NEXT: ", decrypted);
  switch (content) {
  }
}
