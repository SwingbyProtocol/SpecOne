const getAddress = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    let sw = await Swingby.deployed()

    const balance = await sw.balanceOfETH(address)
    console.log(balance.toNumber() / 1e18)

    let ID = process.env.ID

    const mint = await sw.mint(ID, {
        value: 0,
        from: address
    })

    console.log(mint.logs)
    callback() // end process

}