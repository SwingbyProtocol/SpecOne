const {getAddress, getPubkey} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const argBtct = Number(process.argv[4])
const argEth = Number(process.argv[5])
const argSecretHash = process.argv[6]

module.exports = async function (callback) {
  if (!argBtct) {
    const error = 'Requires the amount as first argument'
    console.error(error)
    return callback(error)
  }
  if (!argEth) {
    const error = 'Requires collateral as second argument'
    console.error(error)
    return callback(error)
  }
  if (!argSecretHash) {
    const error = 'Requires a secret hash as third argument'
    console.error(error)
    return callback(error)
  }
  const sw = await Swingby.deployed()
  const _amountOfSat = argBtct * 1e18
  const _amountOfWei = argEth * 1e18
  const _pubkey = getPubkey()
  const _interest = 1000
  const _period = Math.floor(Date.now() / 1000) + 1200
  const _rHash = argSecretHash

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
