const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Swingby = artifacts.require("./Swingby.sol")

const mnemonic = process.env.MNEMONIC_KEY;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet = hdwallet.derivePath(path).getWallet();
const bitcoin = require('bitcoinjs-lib')

const address = "0x" + wallet.getAddress().toString('hex')
// const pubkey = wallet.getPublicKeyString()

// console.log(`your address is: ${address}`)
// console.log(`pubkey: ${pubkey}`)

// import Table from 'cli-table'
const Table = require('cli-table')
const colors = require('colors')
// instantiate
const table = new Table({
    head: ['', colors.magenta('Balance')],
    colWidths: [20, 20]
})

module.exports = async function (deployer, net, accounts) {
    console.log('deployer → ', deployer)
    console.log('net → ', net)
    console.log('accounts → ', accounts)
    let sw = await Swingby.deployed()
    const balance = await sw.balanceOfETH(address)
    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    table.push(
        ['ETH', balance.toNumber() / 1e18],
        ['BTCT', ''],
        ['SGB', '']
    )
    console.log(table.toString())

    process.exit()
}