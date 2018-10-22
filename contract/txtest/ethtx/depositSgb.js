const {getAddress} = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])

module.exports = async function (callback) {
    if (!arg1) return callback('Requires the amount as first argument')
    const sgbE18 = web3.toWei(arg1, 'ether')
    const swingby = await Swingby.deployed()
    const sgb = await Token.at(await swingby.getSgbAddress())
    const approve = await sgb.approve(swingby.address, sgbE18, {
        value: 0,
        from: address
    })
    const depositToken = await swingby.depositToken(sgb.address, sgbE18, {
        value: 0,
        from: address
    })
    console.log('transaction hash: ', depositToken.logs[0].transactionHash)
    callback() // end process
}