const bitcoin = require('bitcoinjs-lib')
const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const swingby = await Swingby.deployed()

    const ID = process.env.ID
    const secret = "0xc172d9303c8f97262c9809fcbbe2649b5be7e62ebc3c1788b60f978653257cda"

    const execute = await swingby.burn(ID, secret, {
        value: 0,
        from: address
    })

    console.log(execute.logs)
    callback() // end process

}
