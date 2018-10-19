const bitcoin = require('bitcoinjs-lib')
const {getAddress, getPubkey} = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const argBtct = Number(process.argv[4])
const argEth = Number(process.argv[5])
const argSr = process.argv[6]

module.exports = async function (callback) {
    if (!argBtct) return callback('Requires the amount as first argument')
    if (!argEth) return callback('Requires collateral')
    if (!argSr) return callback('Requires sR')
    const sw = await Swingby.deployed()

    const _amountOfSat = argBtct * 1e18
    const _amountOfWei = argEth * 1e18
    const _pubkey = getPubkey()
    const _interest = 1000
    const _period = Math.floor(Date.now() / 1000) + 1200
    const _sR = argSr
    const buf = new Buffer(_sR, 'hex')
    const rHash = bitcoin.crypto.sha256(buf)
    const _rHash = '0x' + rHash.toString('hex')

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
