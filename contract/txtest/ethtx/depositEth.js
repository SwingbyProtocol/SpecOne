const getAddress = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = process.argv[4]

module.exports = async function (callback) {
    if (!arg1) return callback('Requires the amount as first argument')
    const sw = await Swingby.deployed()
    const deposit = await sw.depositETH({
        value: web3.toWei(arg1, 'ether'),
        from: address
    })
    console.log(deposit.tx)
    //console.log(deposit.logs[0].args._value.toNumber())
    callback() // end process
}