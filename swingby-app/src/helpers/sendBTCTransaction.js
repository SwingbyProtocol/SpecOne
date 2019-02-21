import bitcoin from 'bitcoinjs-lib'
import rq from 'request-promise'

const tokenList = [
  '7320a3b01c6342c4bee8f06190f58cb8',
  '1dde05676a9f4d12812835603e296db7',
  '0ff673dba6254dfba97361daab3d0cb3'
]

export default function sendBTCTransaction (walletAddress, walletKeypair, htlcAddress, amount, isTestnet = true) {
  return new Promise((resolve, reject) => {
    let networkCypher = 'mainnet'
    let network = bitcoin.networks.bitcoin
    if (isTestnet) {
      network = bitcoin.networks.testnet
      networkCypher = 'test3'
    }
    const newtx = {
      'inputs': [{
        'addresses': [walletAddress]
      }],
      'outputs': [{
        'addresses': [htlcAddress],
        'value': amount
      }]
    }
    const token = tokenList[Math.floor(Math.random() * tokenList.length)]
    const rootUrl = `https://api.blockcypher.com/v1/btc/${networkCypher}`

    var options = {
      method: 'POST',
      uri: rootUrl + '/txs/new',
      body: JSON.stringify(newtx),
      json: false // Automatically stringifies the body to JSON
    }

    rq(options).then((signTransaction) => {
      const result = JSON.parse(signTransaction)

      const txb = new bitcoin.TransactionBuilder(network)
      // txb.setVersion(1)
      const fee = 10300
      let total = 0
      result.tx.inputs.forEach((input, i) => {
        txb.addInput(input.prev_hash, input.output_index)
        total += input.output_value
      })

      txb.addOutput(htlcAddress, amount) // the actual "spend"
      txb.addOutput(walletAddress, total - amount - fee)

      // (in)15000 - (out)12000 = (fee)3000, this is the miner fee
      result.tx.inputs.forEach((input, i) => {
        txb.sign(i, walletKeypair)
      })

      const data = {
        'tx': txb.build().toHex()
      }

      var options = {
        method: 'POST',
        uri: rootUrl + `/txs/push?token=${token}`,
        body: JSON.stringify(data),
        json: false // Automatically stringifies the body to JSON
      }
      rq(options).then((result) => {
        var txid = txb.build().getId()
        // console.log(`transaction Id: ${txid}`)
        resolve(txid)
      })
    })
  })
}
