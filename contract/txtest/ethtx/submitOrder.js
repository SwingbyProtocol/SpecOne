const {getAddress, getPubkey} = require('../utils/address')
const {getHash} = require('../utils/secret')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const argBtct = Number(process.argv[4])
const argEth = Number(process.argv[5])
const argSecret = process.argv[6]

module.exports = async function (callback) {
  if (!argBtct) return callback('Requires the amount as first argument')
  if (!argEth) return callback('Requires collateral as second argument')
  if (!argSecret) return callback('Requires a secret as third argument')
  const sw = await Swingby.deployed()

  const _amountOfSat = argBtct * 1e18
  const _amountOfWei = argEth * 1e18
  const _pubkey = getPubkey()
  const _interest = 1000
  const _period = Math.floor(Date.now() / 1000) + 1200
  const _rHash = getHash(argSecret)

  // console.log('_amountOfSat → ', _amountOfSat)
  // console.log('_amountOfWei → ', _amountOfWei)
  // console.log('_interest → ', _interest)
  // console.log('_period → ', _period)
  // console.log('_rHash → ', _rHash)
  // console.log('_pubkey → ', _pubkey)
  const submitOrder = await sw.submitOrder(
    _amountOfSat,
    _amountOfWei,
    _interest,
    _period,
    _rHash,
    _pubkey, {
      value: 0,
      from: address
    })

  console.log('Order ID: ', submitOrder.logs[0].args.orderId.toString())
  callback() // end process
}
