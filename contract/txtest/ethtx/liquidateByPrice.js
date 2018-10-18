const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Swingby = artifacts.require("./Swingby.sol")

const seedPhrase = process.env.SEED_PHRASE;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(seedPhrase));
const wallet = hdwallet.derivePath(path).getWallet();

const address = "0x" + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

console.log(`your address is: ${address}`)
console.log(`pubkey: ${pubkey}`)

module.exports = async function (callback) {

    let swingby = await Swingby.deployed()

    const ID = process.env.ID

    const rate = await swingby.getMaintenance(ID)

    console.log(rate.toNumber() / 1e18, "%")

    const liquidateByPrice = await swingby.liquidateByPrice(ID, {
        value: 0,
        from: address
    })
    callback() // end process

}