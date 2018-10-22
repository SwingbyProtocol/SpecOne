const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const sw = await Swingby.deployed()

    const balance = await sw.balanceOfETH(address)
    console.log(balance.toNumber() / 1e18)

    const ID = process.env.ID

    const mint = await sw.mint(ID, {
        value: 0,
        from: address
    })

    console.log(mint.logs)
    callback() // end process

}