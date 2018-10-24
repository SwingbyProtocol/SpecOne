const {getAddress} = require('../utils/address')
const add0x = require('../utils/add0x')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = process.argv[4]
const arg2 = Number(process.argv[5])
const arg3 = process.argv[6]
const arg4 = process.argv[7]
const argId = arg1
const argSgb = (arg2)
  ? web3.toWei(arg2, 'ether')
  : web3.toWei(3000, 'ether')
const argTxid = add0x(arg3)
const argRedeemScript = add0x(arg4)

module.exports = async function (callback) {
    const swingby = await Swingby.deployed()
    const confirmOrder = await swingby.confirmOrder(
        argId,
        argTxid,
        argRedeemScript,
        argSgb, {
        value: 0,
        from: address
    })

    console.log('transaction hash: ', confirmOrder.logs[0].transactionHash)
    callback() // end process
}
