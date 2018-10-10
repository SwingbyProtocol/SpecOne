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

module.exports = async function (deployer, net, accounts) {

    let swingby = await Swingby.deployed()

    const ID = process.env.ID
    const rawTx = "0x0100000001305355601d93d7436c42f2fb7582e676efe28c2f6e5e26d07ef2583abb06f10d000000006a473044022035fe371726ab88511cbac914d3f4011797fae13a0dbadad534280309f48ae323022026e6c26dac7e03c2a955c995fe7b5f1f34f63c3167dfa3320d4b1f7eec5ff3ec0121035aeb11b993e293de4bf0329a7dfef76d765985ffc15191c5bb15fef518167ecfffffffff0280841e000000000017a9147231fad8f31e581364d1b78d0778bee29b8420ea87706db900000000001976a9143c3a332e02196b417425bb7b0fcdd8a8e809d10188ac00000000"

    const confirmByWitness = await swingby.confirmByWitness(ID, rawTx, {
        value: 0,
        from: address
    })

    console.log(confirmByWitness.logs)
    process.exit()

    // console.log(submitReq.logs)

}