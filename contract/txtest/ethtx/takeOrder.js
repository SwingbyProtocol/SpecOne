const getAddress = require('../utils/getAddress')

const Generator = artifacts.require("./Generator.sol")
const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    let gen = await Generator.deployed()

    const balance = await gen.balanceOfETH(address)
    console.log(balance.toNumber()/1e18)

    let ID = process.env.ID

    let _txId = "0x44434bbe43903a1ea1a819a01b23d49f2b59122883142d0117043dced358db91"
    let _secretHash = "0x44434bbe43903a1ea1a819a01b23d49f2b59122883142d0117043dced358db91"

    const takeOrder = await gen.takeOrder(ID, _txId, _secretHash, {
        value: 0,
        from: address
    })

    console.log(takeOrder.logs)
    callback() // end process

}