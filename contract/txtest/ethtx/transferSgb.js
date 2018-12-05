const bitcoin = require('bitcoinjs-lib')
const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])
const arg2 = Number(process.argv[5])
const to = getAddress(arg1)
const amount = Number(arg2 + 'e18')

module.exports = async function (callback) {
  // token contract instances
  const sw = await Swingby.deployed()
  const sgb = await Token.at(await sw.getSgbAddress())
  // Transfer
  const transfer = await sgb.transfer(to, amount, {
    value: 0,
    from: address
  })
  console.log(transfer.tx)
  callback() // end process
}
