const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Swingby = artifacts.require("./Swingby.sol")

process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

const mnemonic = process.env.MNEMONIC_KEY;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet = hdwallet.derivePath(path).getWallet();
const bitcoin = require('bitcoinjs-lib')

const address = "0x" + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

console.log(`your address is: ${address}`)
console.log(`pubkey: ${pubkey}`)

module.exports = async function (callback) {
    let sw = await Swingby.deployed()

    const balance = await sw.balanceOfETH(address)
    console.log(balance.toNumber() / 1e18)

    let _amountOfSat = 0.02 * 1e18
    let _amountOfWei = 1 * 1e18
    let _pubkey = pubkey
    let _interest = 1000
    // console.log(Math.floor(Date.now() / 1000))
    let _period = Math.floor(Date.now() / 1000) + 1200

    let _sR = "f0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5"

    let buf = new Buffer(_sR, 'hex');

    let _rHash = bitcoin.crypto.sha256(buf)

    console.log(_rHash.toString('hex'), pubkey)

    const submitOrder = await sw.submitOrder(
        _amountOfSat,
        _amountOfWei,
        _interest,
        _period,
        '0x' + _rHash.toString('hex'),
        _pubkey, {
            value: 0,
            from: address
        })

    console.log(submitOrder.logs)
    callback() // end process
}
