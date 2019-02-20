import bitcoin from 'bitcoinjs-lib'
import bip65 from 'bip65'
const crypto = require('crypto')
const Buffer = require('buffer').Buffer

function utcNow () {
  return Math.floor(Date.now() / 1000)
}

export default function createHTLC (secretRHashHex, endTime, senderPubkey, receiverPubkey, testnet = true) {
  return new Promise((resolve, reject) => {
    const secretRHash = Buffer.from(secretRHashHex, 'hex')
    if (!endTime) {
      endTime = bip65.encode({
        utc: utcNow() + 1400
      })
    }

    const senderPubkeyHash = bitcoin.crypto.hash160(senderPubkey)
    const receiverPubkeyHash = bitcoin.crypto.hash160(receiverPubkey)

    var secretS = crypto.randomBytes(32)

    var secretSHash = bitcoin.crypto.sha256(secretS)
    // var now = Math.floor(Date.now() / 1000)

    var redeemScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
      bitcoin.script.number.encode(endTime),
      bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
      bitcoin.opcodes.OP_DROP,
      bitcoin.opcodes.OP_SHA256,
      secretSHash,
      bitcoin.opcodes.OP_EQUALVERIFY,
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      receiverPubkeyHash,

      bitcoin.opcodes.OP_ELSE,
      bitcoin.opcodes.OP_SHA256,
      secretRHash,
      bitcoin.opcodes.OP_EQUALVERIFY,
      bitcoin.opcodes.OP_DUP,
      bitcoin.opcodes.OP_HASH160,
      senderPubkeyHash,
      bitcoin.opcodes.OP_ENDIF,

      bitcoin.opcodes.OP_EQUALVERIFY,
      bitcoin.opcodes.OP_CHECKSIG
    ])

    let network = bitcoin.networks.bitcoin
    if (testnet) {
      network = bitcoin.networks.testnet
    }

    const htlcAddress = bitcoin.payments.p2sh({
      redeem: {
        output: redeemScript,
        network: network
      },
      network: network
    })
    var data = {
      S: secretS.toString('hex'),
      htlcAddress: htlcAddress.address,
      rHash: secretRHash.toString('hex'),
      sHash: secretSHash.toString('hex'),
      redeemScript: redeemScript.toString('hex'),
      txId: ''
    }
    resolve(data)
  })
}
