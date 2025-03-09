import { startRelay } from "./libp2p.ts";

startRelay().then(() => {
    console.log("Relay started");
    })