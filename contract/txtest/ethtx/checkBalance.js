const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39")
const Swingby = artifacts.require("./Swingby.sol")
const Token = artifacts.require("./Token.sol")

const mnemonic = process.env.MNEMONIC_KEY
const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic))
const wallet = hdwallet.derivePath(path).getWallet()
const bitcoin = require('bitcoinjs-lib')

const address = "0x" + wallet.getAddress().toString('hex')
// const pubkey = wallet.getPublicKeyString()

// console.log(`your address is: ${address}`)
// console.log(`pubkey: ${pubkey}`)

const Table = require('cli-table')
const colors = require('colors')
// instantiate
const table = new Table({
    head: [
        `Account ${process.env.ACCOUNT}`,
        colors.magenta('Swingby balance'),
        colors.magenta('Account balance'),
    ],
    colWidths: [15, 20, 20]
})

module.exports = async function (callback) {
    // token contract instances
    const sw = await Swingby.deployed()
    const sgb = await Token.at(await sw.getSgbAddress())
    const btct = await Token.at(await sw.getBtctAddress())
    // Swingby contract
    const SwBalanceWei = await sw.balanceOfETH(address)
    const SwBalanceEth = SwBalanceWei.toNumber() / 1e18
    const SwBalanceSgb = await sw.balanceOfToken(sgb.address, address)
    const SwBalanceBtct = await sw.balanceOfToken(btct.address, address)
    // Account balances
    const AccBalanceEth = web3.fromWei(web3.eth.getBalance(web3.eth.accounts[process.env.ACCOUNT]), 'ether')
    const AccBalanceSgbBIint = await sgb.balanceOf(address)
    const AccBalanceSgb = AccBalanceSgbBIint / 1e18
    const AccBalanceBtctBIint = await btct.balanceOf(address)
    const AccBalanceBtct = AccBalanceBtctBIint / 1e18
    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    table.push(
        ['ETH', SwBalanceEth, AccBalanceEth],
        ['BTCT', SwBalanceBtct, AccBalanceBtct],
        ['SGB', SwBalanceSgb, AccBalanceSgb]
    )
    console.log(table.toString())

    callback() // end process
}