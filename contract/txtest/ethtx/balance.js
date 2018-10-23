const bitcoin = require('bitcoinjs-lib')
const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

const Table = require('cli-table')
const colors = require('colors')

module.exports = async function (callback) {
  // token contract instances
  const sw = await Swingby.deployed()
  const sgb = await Token.at(await sw.getSgbAddress())
  const btct = await Token.at(await sw.getBtctAddress())
  async function checkBalances (_address, nr) {
    // Account balances
    const AccBalanceEth = web3.fromWei(web3.eth.getBalance(_address), 'ether')
    const AccBalanceBtct_ = await btct.balanceOf(_address)
    const AccBalanceBtct = AccBalanceBtct_ / 1e18
    const AccBalanceSgb_ = await sgb.balanceOf(_address)
    const AccBalanceSgb = AccBalanceSgb_ / 1e18
    // Swingby contract - deposited
    const SwDepositedEth_ = await sw.balanceOfETH(_address)
    const SwDepositedEth = SwDepositedEth_.toNumber() / 1e18
    const SwDepositedBtct_ = await sw.balanceOfToken(btct.address, _address)
    const SwDepositedBtct = SwDepositedBtct_ / 1e18
    const SwDepositedSgb_ = await sw.balanceOfToken(sgb.address, _address)
    const SwDepositedSgb = SwDepositedSgb_ / 1e18
    // Swingby contract - locked
    const SwLockedEth_ = await sw.getLockedBalanceETH(_address)
    const SwLockedEth = SwLockedEth_.toNumber() / 1e18
    const SwLockedBtct_ = await sw.getLockedBalanceBTCT(_address)
    const SwLockedBtct = SwLockedBtct_ / 1e18
    const SwLockedSgb_ = await sw.getLockedBalanceSGB(_address)
    const SwLockedSgb = SwLockedSgb_ / 1e18
    const table = new Table({
      head: [
        colors.red(`Account ${nr}`),
        colors.magenta('Wallet balance'),
        colors.magenta('Swingby (deposit)'),
        colors.magenta('Swingby (locked)'),
      ],
      colWidths: [15, 19, 19, 19]
    })
    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    table.push(
      ['ETH', AccBalanceEth, SwDepositedEth, SwLockedEth],
      ['BTCT', AccBalanceBtct, SwDepositedBtct, SwLockedBtct],
      ['SGB', AccBalanceSgb, SwDepositedSgb, SwLockedSgb],
    )
    console.log(table.toString())
  }
  await checkBalances(address, 0)
  await checkBalances(getAddress(1), 1)

  callback() // end process
}
