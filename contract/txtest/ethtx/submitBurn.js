const {getAddress} = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const sw = await Swingby.deployed()

    const ID = process.env.ID

    const cancel = await sw.submitBurn(ID, {
        value: 0,
        from: address
    })

    console.log(cancel.logs)
    callback() // end process

}