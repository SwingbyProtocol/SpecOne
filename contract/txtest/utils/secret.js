const bitcoin = require('bitcoinjs-lib')
const randomBytes = require('randombytes')

function generateSecret () {
  return randomBytes(32).toString('hex')
}

function getHash (secret) {
  if (!secret) return console.error('recruires a secret')
  const buf = new Buffer(secret, 'hex')
  const hash = bitcoin.crypto.sha256(buf).toString('hex')
  return hash
}

module.exports = {generateSecret, getHash}
