import { startRelay } from "./libp2p";

startRelay().then(() => {
    console.log("Relay started");
    })