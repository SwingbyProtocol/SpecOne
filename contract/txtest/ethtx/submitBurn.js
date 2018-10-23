const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])
const argId = arg1

module.exports = async function (callback) {
    const sw = await Swingby.deployed()
    const burnRequest = await sw.submitBurn(
        argId, {
        value: 0,
        from: address
    })
    console.log('transaction hash: ', burnRequest.logs[0].transactionHash)
    callback() // end process
}
