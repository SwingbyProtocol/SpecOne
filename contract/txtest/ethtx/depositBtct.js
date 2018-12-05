const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])

module.exports = async function (callback) {
    if (!arg1) return callback('Requires the amount as first argument')
    const btctE18 = web3.toWei(arg1, 'ether')

    const swingby = await Swingby.deployed()
    const token = await Token.at(await swingby.getBtctAddress())
    const approve = await token.approve(swingby.address, btctE18, {
        value: 0,
        from: address
    })
    const depositToken = await swingby.depositToken(token.address, btctE18, {
        value: 0,
        from: address
    })
    console.log('transaction hash: ', depositToken.logs[0].transactionHash)
    callback() // end process
}