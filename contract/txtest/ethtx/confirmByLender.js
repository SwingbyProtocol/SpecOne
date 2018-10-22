const {getAddress} = require('../utils/address')

const Swingby = artifacts.require('./Swingby.sol')
const Token = artifacts.require('./Token.sol')

const address = getAddress()

module.exports = async function (callback) {

    const swingby = await Swingby.deployed()

    const ID = process.env.ID
    const txId = "0xa4245a22e809698217cdbaaf18b6c9489559267ad4492cd4bf36a2ecd3b410c8"
    const rs = "0x6304332a6b5bb175a820f4b937bbadbf3d64d6f7ba78672e59790f6047693172616c3d1d4f1bd440f56d8876a914cd5cab7ec76ad300712c02ccc51b464fdf7e5e06670483706b5bb17576a9142f5e9b3a149467d002195d790ad513eac7496aa86888ac"
    const _amountOfToken = web3.toWei(3000, 'ether')

    const confirmByLender = await swingby.confirmByLender(ID, txId, rs, _amountOfToken, {
        value: 0,
        from: address
    })

    console.log(confirmByLender.logs)
    callback() // end process

    // console.log(submitReq.logs)

}