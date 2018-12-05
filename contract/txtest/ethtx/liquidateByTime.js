const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const swingby = await Swingby.deployed()

    const ID = process.env.ID

    const liquidateByTime = await swingby.liquidateByTime(ID, {
        value: 0,
        from: address
    })
    callback() // end process

}