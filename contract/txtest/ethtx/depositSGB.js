const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Swingby = artifacts.require("./Swingby.sol")
const Token = artifacts.require("./Token.sol")

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

    const token = await Token.at(await swingby.getSGB())

    const tokenBlance = await token.balanceOfETH(address)
    console.log(tokenBlance.toNumber())

    const approve = await token.approve(swingby.address, web3.toWei(6000, 'ether'))

    const depositToken = await swingby.depositToken(token.address, web3.toWei(6000, 'ether'), {
        value: 0,
        from: address
    })

    console.log(depositToken.logs)
    process.exit()

}