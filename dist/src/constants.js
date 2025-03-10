export const CHAT_TOPIC = "universal-connectivity";
export const CHAT_FILE_TOPIC = "universal-connectivity-file";
export const PUBSUB_PEER_DISCOVERY = "universal-connectivity-browser-peer-discovery";
export const FILE_EXCHANGE_PROTOCOL = "/universal-connectivity-file/1";
export const DIRECT_MESSAGE_PROTOCOL = "/universal-connectivity/dm/1.0.0";
export const CIRCUIT_RELAY_CODE = 290;
export const MIME_TEXT_PLAIN = "text/plain";
export function trimAddresses(list) {
    const op = [];
    for (const addr of list) {
        const str = addr.toString();
        if (!str.includes("127.0.0.1")) {
            op.push(str);
        }
    }
    return op;
}
export function random(len) {
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
export function r(max) {
    return Math.floor(Math.random() * max);
}
//# sourceMappingURL=constants.js.map