const bitcoin = require('bitcoinjs-lib')
const getAddress = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = process.argv[4]

module.exports = async function (callback) {
    if (!arg1) return callback('Requires the amount as first argument')
    const sw = await Swingby.deployed()

    const balance = await sw.balanceOfETH(address)
    console.log(balance.toNumber() / 1e18)

    const _amountOfSat = 0.02 * 1e18
    const _amountOfWei = 1 * 1e18
    const _pubkey = pubkey
    const _interest = 1000
    // console.log(Math.floor(Date.now() / 1000))
    const _period = Math.floor(Date.now() / 1000) + 1200

    const _sR = "f0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5"

    const buf = new Buffer(_sR, 'hex');

    const _rHash = bitcoin.crypto.sha256(buf)

    console.log(_rHash.toString('hex'), pubkey)

    const submitOrder = await sw.submitOrder(
        _amountOfSat,
        _amountOfWei,
        _interest,
        _period,
        '0x' + _rHash.toString('hex'),
        _pubkey, {
            value: 0,
            from: address
        })

    console.log(submitOrder.logs)
    callback() // end process
}
