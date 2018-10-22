const {getAddress} = require('../utils/address')

const Generator = artifacts.require("./Generator.sol")
const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const gen = await Generator.deployed()

    const balance = await gen.balanceOfETH(address)
    console.log(balance.toNumber()/1e18)

    const ID = process.env.ID

    const confirmeBySubmitter = await gen.confirmeBySubmitter(ID, {
        value: 0,
        from: address
    })

    console.log(confirmeBySubmitter.logs)
    callback() // end process

}