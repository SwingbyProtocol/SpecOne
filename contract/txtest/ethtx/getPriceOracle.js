const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])

module.exports = async function (callback) {
  const sw = await Swingby.deployed()
  const ethValueInBTC_ = await sw.getPrice()
  const ethValueInBtc = ethValueInBTC_ / 1e18
  console.log('1 BTC = ', 1 / ethValueInBtc , 'ETH')
  console.log('1 ETH = ', 1 * ethValueInBtc, 'BTC')
  if (!arg1 || arg1 === 1) return callback() // end process
  console.log('================================')
  console.log(`${arg1} BTC = `, arg1 / ethValueInBtc , 'ETH')
  callback() // end process
}
