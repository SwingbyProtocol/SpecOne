const {getAddress} = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {
  const sw = await Swingby.deployed()
  const price = await sw.getPrice()
  console.log('The price of ETH/BTC  → ', price / 1e18)
  callback() // end process
}
