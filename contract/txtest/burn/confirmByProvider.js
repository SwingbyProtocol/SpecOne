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

    _aOfSat = web3.toWei(1, 'ether')
    _aOfWei = web3.toWei(48, 'ether')
    _isMinter = true
    _pubkey = pubkey

    const submitReq = await burn.submitReq(_aOfSat, _aOfWei, _isMinter, _pubkey, {
        value: 0,
        from: address
    })

    console.log(submitReq.logs[0].args._wethAmount.toNumber())
    // console.log(submitReq.logs)

}