const {getAddress} = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()
const arg1 = Number(process.argv[4])

module.exports = async function (callback) {

    if (!arg1) return callback('Requires the amount as first argument')
    const swingby = await Swingby.deployed()

    const token = await Token.at(await swingby.getBtctAddress())

    const tokenBlance = await token.balanceOf(address)
    console.log(tokenBlance.toNumber())

    const approve = await token.approve(swingby.address, web3.toWei(0.02, 'ether'))

    const depositToken = await swingby.depositToken(token.address, web3.toWei(0.02, 'ether'), {
        value: 0,
        from: address
    })

    console.log(depositToken.logs)
    callback() // end process
}