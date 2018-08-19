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

    const ID = process.env.ID
    const txId = "0xa4245a22e809698217cdbaaf18b6c9489559267ad4492cd4bf36a2ecd3b410c8"
    const rs = "0x6304332a6b5bb175a820f4b937bbadbf3d64d6f7ba78672e59790f6047693172616c3d1d4f1bd440f56d8876a914cd5cab7ec76ad300712c02ccc51b464fdf7e5e06670483706b5bb17576a9142f5e9b3a149467d002195d790ad513eac7496aa86888ac"

    const confirmByProvider = await burn.confirmByProvider(ID, txId, rs, {
        value: 0,
        from: address
    })

    console.log(confirmByProvider.logs)
    process.exit()

    // console.log(submitReq.logs)

}