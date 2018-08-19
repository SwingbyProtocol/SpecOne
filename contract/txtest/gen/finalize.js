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

    let _secret = "0xf0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5"

    const finalize = await gen.finalize(ID, _secret, {
        value: 0,
        from: address
    })

    console.log(finalize.logs[0].args._verifiedTime.toNumber())
    process.exit()

}