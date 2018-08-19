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

    const deposit = await gen.deposit({
        value: web3.toWei('24', 'ether'),
        from: address
    })
    console.log(deposit.tx)
    process.exit()

    //console.log(deposit.logs[0].args._value.toNumber())
}