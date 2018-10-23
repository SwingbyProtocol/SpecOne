const {getAddress, getPubkey} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])
const arg2 = Number(process.argv[5])
const arg3 = process.argv[6]
const argBtct = arg1
const argEth = arg2
const argSecretHash = (arg3.slice(0, 2) !== '0x')
  ? '0x' + arg3
  : arg3

module.exports = async function (callback) {
  if (!argBtct) return callback('Requires the amount as first argument')
  if (!argEth) return callback('Requires collateral as second argument')
  if (!argSecretHash) return callback('Requires a secret hash as third argument')
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
