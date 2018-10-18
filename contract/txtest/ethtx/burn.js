const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Swingby = artifacts.require("./Swingby.sol")

const mnemonic = process.env.MNEMONIC_KEY;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet = hdwallet.derivePath(path).getWallet();

const address = "0x" + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

console.log(`your address is: ${address}`)
console.log(`pubkey: ${pubkey}`)

module.exports = async function (callback) {

    let swingby = await Swingby.deployed()

    let ID = process.env.ID
    let secret = "0xc172d9303c8f97262c9809fcbbe2649b5be7e62ebc3c1788b60f978653257cda"

    const execute = await swingby.burn(ID, secret, {
        value: 0,
        from: address
    })

    console.log(execute.logs)
    callback() // end process

}
