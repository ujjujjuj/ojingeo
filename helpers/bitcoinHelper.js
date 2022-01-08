const bitcore = require("bitcore-lib");
const axios = require("axios");
require("dotenv").config();

const frontmanPrivateKey = bitcore.PrivateKey.fromWIF(process.env.BITCOIN_WALLET_PRIVATE_KEY_WIF);
const frontmanAddress = frontmanPrivateKey.toAddress();

const getUtxos = async address => {
    const response = await axios.get(`https://sochain.com/api/v2/get_tx_unspent/BTCTEST/${address}`);
    let utxos = [];
    for (let i = 0; i < response.data.data.txs.length; i++) {
        let inf = response.data.data.txs[i];
        utxos.push(new bitcore.Transaction.UnspentOutput({
            "txid": inf.txid,
            "script": inf.script_hex,
            "vout": inf.output_no,
            "address": address,
            "amount": inf.value
        }));
    }
    return utxos
}

const broadcast = async transaction => {
    const response = await axios.post(`https://sochain.com/api/v2/send_tx/BTCTEST`, data = {
        tx_hex: transaction
    });
    return response.data
}

const getSatoshiFactor = async () => {
    const resp = await axios.get("https://blockchain.info/ticker");
    return 100000000 / resp.data.INR.last
}

const createTransaction = async paymentsList => {
    const uxtos = await getUtxos(frontmanAddress);
    tx = new bitcore.Transaction(uxtos);

    tx.from(uxtos);
    const satoshiFactor = await getSatoshiFactor();

    for (let payment of paymentsList) {
        // console.log(payment[1]);
        tx.to(payment[0], Math.floor(payment[1] * satoshiFactor));
    }
    tx.change(frontmanAddress);
    tx.sign(frontmanPrivateKey);

    console.log(tx.toObject());

    return broadcast(tx.serialize());

}

const main = async () => {
    console.log(frontmanAddress.toString("base64"));
    // const vipPrivateKey = bitcore.PrivateKey.fromWIF("")
    // const vipAddress = vipPrivateKey.toAddress();

    // console.log(await createTransaction([[vipAddress, 1000]]));

}

// if __name__ == "__main__"
if (require.main === module) {
    main();
}

module.exports = { createTransaction };


