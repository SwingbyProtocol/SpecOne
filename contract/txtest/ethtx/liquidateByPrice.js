const getAddress = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const swingby = await Swingby.deployed()

    const ID = process.env.ID

    const rate = await swingby.getMaintenance(ID)

    console.log(rate.toNumber() / 1e18, "%")

    const liquidateByPrice = await swingby.liquidateByPrice(ID, {
        value: 0,
        from: address
    })
    callback() // end process

}