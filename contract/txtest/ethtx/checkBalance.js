const bitcoin = require('bitcoinjs-lib')
const {getAddress} = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

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
    const SwBalanceEth_ = await sw.balanceOfETH(address)
    const SwBalanceEth = SwBalanceEth_.toNumber() / 1e18
    const SwBalanceBtct_ = await sw.balanceOfToken(btct.address, address)
    const SwBalanceBtct = SwBalanceBtct_ / 1e18
    const SwBalanceSgb_ = await sw.balanceOfToken(sgb.address, address)
    const SwBalanceSgb = SwBalanceSgb_ / 1e18
    // Account balances
    const AccBalanceEth = web3.fromWei(web3.eth.getBalance(address), 'ether')
    const AccBalanceBtct_ = await btct.balanceOf(address)
    const AccBalanceBtct = AccBalanceBtct_ / 1e18
    const AccBalanceSgb_ = await sgb.balanceOf(address)
    const AccBalanceSgb = AccBalanceSgb_ / 1e18
    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    table.push(
        ['ETH', SwBalanceEth, AccBalanceEth],
        ['BTCT', SwBalanceBtct, AccBalanceBtct],
        ['SGB', SwBalanceSgb, AccBalanceSgb]
    )
    console.log(table.toString())

    callback() // end process
}