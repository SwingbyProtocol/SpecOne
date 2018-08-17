const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Burner = artifacts.require("./Burner.sol")
const Generator = artifacts.require("./Generator.sol")
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

    let burn = await Burner.deployed()
    let gen = await Generator.deployed()


    const token = await Token.at(await gen.getBTCT())

    const tokenBlance = await token.balanceOf(address)
    console.log(tokenBlance.toNumber())

    const approve = await token.approve(burn.address, web3.toWei(0.02, 'ether'))

    const depositToken = await burn.depositToken(token.address, web3.toWei(0.02, 'ether'), {
        value: 0,
        from: address
    })

    console.log(depositToken.logs)
}