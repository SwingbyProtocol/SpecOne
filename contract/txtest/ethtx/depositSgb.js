const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Swingby = artifacts.require("./Swingby.sol")
const Token = artifacts.require("./Token.sol")

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

    const token = await Token.at(await swingby.getSgbAddress())

    const tokenBlance = await token.balanceOf(address)
    console.log(tokenBlance.toNumber())

    const approve = await token.approve(swingby.address, web3.toWei(6000, 'ether'))

    const depositToken = await swingby.depositToken(token.address, web3.toWei(6000, 'ether'), {
        value: 0,
        from: address
    })

    console.log(depositToken.logs)
    callback() // end process

}