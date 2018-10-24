const {getAddress, getPubkey} = require('../utils/address')
const add0x = require('../utils/add0x')
const {generateSecret, getHash} = require('../utils/secret')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])
const arg2 = Number(process.argv[5])
const arg3 = process.argv[6]
let argBtct = arg1
let argEth = arg2
let argSecretHash = arg3

module.exports = async function (callback) {
  const sw = await Swingby.deployed()
  // prepare parameters
  if (!argBtct) return callback('Requires the amount as first argument')
  argBtct = argBtct * 1e18
  if (!argEth) {
    const ethValueInBTC = await sw.getPrice()
    argEth = argBtct / ethValueInBTC * 1.65
  }
  argEth = argEth * 1e18
  if (!argSecretHash) {
    const secret = generateSecret()
    argSecretHash = getHash(secret)
    console.log(`New secret generated!
      secret: ${secret}
      hash  : ${argSecretHash}
    `)
  }
  argSecretHash = add0x(argSecretHash)
  const _amountOfSat = argBtct
  const _amountOfWei = argEth
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
