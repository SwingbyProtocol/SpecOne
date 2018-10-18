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

module.exports = async function (callback) {

    let gen = await Generator.deployed()

    const balance = await gen.balanceOfETH(address)
    console.log(balance.toNumber()/1e18)

    let ID = process.env.ID

    const confirmeBySubmitter = await gen.confirmeBySubmitter(ID, {
        value: 0,
        from: address
    })

    console.log(confirmeBySubmitter.logs)
    callback() // end process

}