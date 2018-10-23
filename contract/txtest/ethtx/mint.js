const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')

const address = getAddress()
const arg1 = process.argv[4]
const argId = arg1

module.exports = async function (callback) {
    const sw = await Swingby.deployed()
    const mint = await sw.mint(argId, {
        value: 0,
        from: address
    })

    console.log('transaction hash: ', mint.logs[0].transactionHash)
    callback() // end process
}
