const WebSocket = require("ws");
const axios = require("axios");

setTimeout(start, 2000); // Wait for the tendermint node and abci to start up and connect to eachother
function start() {
  const binance = new WebSocket("wss://data-stream.binance.vision/ws/btcusdt@aggTrade");
  const abciAddress = process.argv[2];
  const rpcAddress = process.argv[3];
  const abci = new WebSocket("ws://" + abciAddress + ":8088");
  let lastPrice = 0;
  let lastTimestamp = 0;

  abci.on("open", () => {
    console.log("ABCI connected!");
  });
  abci.on("message", (data) => {
    console.log("received: %s", data);
  });

  binance.on("open", () => {
    console.log("Binance connected!");
  });
  binance.on("message", (data) => {
    const info = JSON.parse(data);
    const price = toUint32Bytes(info.p * 1); // Just to be sure it's converted to an integer, not passed as string
    const timestamp = toUint64Bytes((info.E / 1000) * 1); // 1s timestamps (first event of the second decides the price)
    const priceAsUint32 = toUint(price);
    const timestampAsUint64 = toUint(timestamp);
    if (priceAsUint32 != lastPrice) {
      if (lastTimestamp == timestampAsUint64) {
        return; // max 1 update per timestamp, not applicable to streams updating on a set interval
      }

      console.log(`BTCUSDT is ${info.p} at ${info.E}`);
      abci.send(price.concat(timestamp), (err) => {
        if (err) {
          console.error("xnode communcication error", err);
          return;
        }

        // Some algorithm to decide which node should make transactions should be put in place here
        // Two nodes generating the same transaction is no problem, just a possible waste of bandwith
        if (abciAddress == "192.167.10.6") {
          setTimeout(async () => {
            const priceHex = priceAsUint32.toString(16).padStart(8, "0");
            const timestampHex = timestampAsUint64.toString(16).padStart(16, "0");
            const url = rpcAddress + "/broadcast_tx_async?tx=0x" + priceHex + timestampHex; // broadcast_tx_commit if you want to wait until confirmed (included in block)
            try {
              console.log("trying transaction", url, `(${priceAsUint32} at ${timestampAsUint64})`);
              /*const res = */ await axios.request(url);
              // Commented out succes message to make logs more readable
              // console.log("transaction response", res?.data);
            } catch (err) {
              console.error(err?.response?.data ?? err);
            }
          }, 100);
        }
      });

      lastPrice = priceAsUint32;
      lastTimestamp = timestampAsUint64;
    }
  });
}

function toUint32Bytes(number) {
  let bytesArray = [0, 0, 0, 0];

  for (let i = bytesArray.length - 1; i >= 0; i--) {
    let byte = number & 0xff;
    bytesArray[i] = byte;
    number = (number - byte) / 256;
  }

  return bytesArray;
}

function toUint64Bytes(number) {
  let bytesArray = [0, 0, 0, 0, 0, 0, 0, 0];

  for (let i = bytesArray.length - 1; i >= 0; i--) {
    let byte = number & 0xff;
    bytesArray[i] = byte;
    number = (number - byte) / 256;
  }

  return bytesArray;
}

function toUint(bytesArray) {
  let value = 0;
  for (let i = 0; i < bytesArray.length; i++) {
    value = value * 256 + bytesArray[i];
  }

  return value;
}