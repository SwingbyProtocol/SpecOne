const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Burner = artifacts.require("./Burner.sol")

const mnemonic = process.env.MNEMONIC_KEY;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet = hdwallet.derivePath(path).getWallet();

const address = "0x" + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

console.log(`your address is: ${address}`)
console.log(`pubkey: ${pubkey}`)

module.exports = async function (deployer, net, accounts) {

    let burn = await Burner.deployed()

    let ID = process.env.ID
    let secret = "0xc172d9303c8f97262c9809fcbbe2649b5be7e62ebc3c1788b60f978653257cda"

    const execute = await burn.execute(ID, secret, {
        value: 0,
        from: address
    })

    console.log(execute.logs)
}