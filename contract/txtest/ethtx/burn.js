const bitcoin = require('bitcoinjs-lib')
const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])
const argId = arg1
const arg2 = process.argv[5]
const argSecretHtlcLender = arg2

module.exports = async function (callback) {
    const swingby = await Swingby.deployed()
    const burn = await swingby.burn(
        argId,
        argSecretHtlcLender, {
        value: 0,
        from: address
    })
    console.log('transaction hash: ', burn.logs[0].transactionHash)
    callback() // end process
}
