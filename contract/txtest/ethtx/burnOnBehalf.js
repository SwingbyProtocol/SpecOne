const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const swingby = await Swingby.deployed()

    const burnOnBehalf = await swingby.burnOnBehalf(web3.toWei(0.02, 'ether'), {
        value: 0,
        from: address
    })

    console.log(burnOnBehalf.logs)
    callback() // end process

}