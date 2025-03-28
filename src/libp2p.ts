import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { tcp } from "@libp2p/tcp";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { directMessage } from "./direct-message.ts";
import { identify } from "@libp2p/identify";
import { Libp2pType } from "./constants.ts";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { webSockets } from "@libp2p/websockets";
import fs from "fs";
import path from "path";
import { random } from "./constants.ts";

let key: string;
const configPath = path.join(process.cwd(), "config.json");

if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  key = config.key;
} else {
  key = random(64, true, false);
  fs.writeFileSync(configPath, JSON.stringify({ key }, null, 2));
  console.log("Key generated and saved to config.json");
}

const prvKey = generateKeyPairFromSeed("Ed25519", Buffer.from(key, "hex"));
export async function startRelay(): Promise<Libp2pType> {
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
    // peerDiscovery: [
    //   bootstrap({
    //     list: [
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    //       '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
    //       '/dnsaddr/va1.bootstrap.libp2p.io/p2p/12D3KooWKnDdG3iXw9eTFijk3EWSunZcFi54Zka4wmtqtt6rPxc8',
    //       '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
    //       '/ip4/104.131.131.82/udp/4001/quic-v1/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
    //     ],
    //   }),
    // ],
  });
  await handleEvents(node);
  await node.start();
  // console.log('Relay node started with addresses:', node.getMultiaddrs())

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
    console.log("SIGUSR2 received, restarting...");
    await node.stop();
    // Restart the node
    const newNode = await startRelay();
    await newNode.start();
    console.log("Node restarted");
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
  // 👇 explicitly dial peers discovered via pubsub
  libp2p.addEventListener("peer:discovery", (event) => {
    const { multiaddrs, id } = event.detail;

    if (libp2p.getConnections(id)?.length > 0) {
      console.log(`Already connected to peer %s. Will not try dialling: `, id);
      return;
    }
    console.log("Connecting to: ", id);
    //dial
  });
  // 👇 explicitly dial peers discovered via pubsub
  libp2p.addEventListener("peer:connect", (event) => {
    const { detail } = event;

    console.log("Connected to: ", detail);
  });
  // 👇 explicitly dial peers discovered via pubsub
  libp2p.addEventListener("peer:discovery", (event) => {
    const { detail } = event;

    console.log("Discovered peer: ", detail);
  });
}
