const {getAddress} = require('../utils/getAddress')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const sw = await Swingby.deployed()

    const _sR = "f0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5"
    const ID = process.env.ID

    const cancel = await sw.cancelOrder(ID, '0x' + _sR, {
        value: 0,
        from: address
    })

    console.log(cancel.logs)
    callback() // end process

}