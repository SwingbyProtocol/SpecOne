const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = process.argv[4]
const arg2 = Number(process.argv[5])
const arg3 = process.argv[6]
const arg4 = process.argv[7]
const argId = arg1
const argSgb = web3.toWei(arg2, 'ether')
const argTxid = (arg3.slice(0, 2) !== '0x')
    ? '0x' + arg3
    : arg3
const argRs = (arg4.slice(0, 2) !== '0x')
    ? '0x' + arg4
    : arg4

module.exports = async function (callback) {
    const swingby = await Swingby.deployed()
    const confirmByLender = await swingby.confirmByLender(
        argId,
        argTxid,
        argRs,
        argSgb, {
        value: 0,
        from: address
    })

    console.log(confirmByLender.logs)
    callback() // end process
}
