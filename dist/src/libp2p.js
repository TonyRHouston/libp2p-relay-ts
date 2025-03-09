var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    key = random(64, true, false);
    fs.writeFileSync(configPath, JSON.stringify({ key }, null, 2));
    console.log("Key generated and saved to config.json");
}
const prvKey = generateKeyPairFromSeed("Ed25519", Buffer.from(key, "hex"));
export function startRelay() {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield createLibp2p({
            privateKey: yield prvKey,
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
        yield handleEvents(node);
        yield node.start();
        // console.log('Relay node started with addresses:', node.getMultiaddrs())
        process.on("SIGTERM", () => __awaiter(this, void 0, void 0, function* () {
            yield node.stop();
            process.exit(0);
        }));
        process.on("SIGINT", () => __awaiter(this, void 0, void 0, function* () {
            yield node.stop();
            process.exit(0);
        }));
        process.on("exit", () => __awaiter(this, void 0, void 0, function* () {
            yield node.stop();
            process.exit(0);
        }));
        process.on("uncaughtException", (err) => __awaiter(this, void 0, void 0, function* () {
            console.error("Uncaught Exception:", err);
            yield node.stop();
            process.exit(1);
        }));
        process.on("unhandledRejection", (reason) => __awaiter(this, void 0, void 0, function* () {
            console.error("Unhandled Rejection:", reason);
            yield node.stop();
            process.exit(1);
        }));
        process.on("SIGUSR2", () => __awaiter(this, void 0, void 0, function* () {
            console.log("SIGUSR2 received, restarting...");
            yield node.stop();
            // Restart the node
            const newNode = yield startRelay();
            yield newNode.start();
            console.log("Node restarted");
            process.exit(0);
        }));
        process.on("SIGUSR1", () => __awaiter(this, void 0, void 0, function* () {
            console.log("SIGUSR1 received, stopping...");
            yield node.stop();
            // Stop the node
            console.log("Node stopped");
            process.exit(0);
        }));
        process.on("SIGBREAK", () => __awaiter(this, void 0, void 0, function* () {
            console.log("SIGBREAK received, stopping...");
            yield node.stop();
            // Stop the node
            console.log("Node stopped");
            process.exit(0);
        }));
        process.on("SIGQUIT", () => __awaiter(this, void 0, void 0, function* () {
            console.log("SIGQUIT received, stopping...");
            yield node.stop();
            // Stop the node
            console.log("Node stopped");
            process.exit(0);
        }));
        return node;
    });
}
function handleEvents(libp2p) {
    return __awaiter(this, void 0, void 0, function* () {
        // 👇 explicitly dial peers discovered via pubsub
        libp2p.addEventListener("peer:discovery", (event) => {
            var _a;
            const { multiaddrs, id } = event.detail;
            if (((_a = libp2p.getConnections(id)) === null || _a === void 0 ? void 0 : _a.length) > 0) {
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
    });
}
//# sourceMappingURL=libp2p.js.map