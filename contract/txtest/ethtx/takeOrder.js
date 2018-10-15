const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Generator = artifacts.require("./Generator.sol")

const mnemonic = process.env.MNEMONIC_KEY;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet = hdwallet.derivePath(path).getWallet();

const address = "0x" + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

console.log(`your address is: ${address}`)
console.log(`pubkey: ${pubkey}`)

module.exports = async function (deployer, net, accounts) {

    let gen = await Generator.deployed()

    const balance = await gen.balanceOf(address)
    console.log(balance.toNumber()/1e18)

    let ID = process.env.ID

    let _txId = "0x44434bbe43903a1ea1a819a01b23d49f2b59122883142d0117043dced358db91"
    let _secretHash = "0x44434bbe43903a1ea1a819a01b23d49f2b59122883142d0117043dced358db91"

    const takeOrder = await gen.takeOrder(ID, _txId, _secretHash, {
        value: 0,
        from: address
    })

    console.log(takeOrder.logs)
    process.exit()

}