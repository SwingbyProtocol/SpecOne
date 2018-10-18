const hdkey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')

const ACCOUNT = process.env.ACCOUNT
const seedPhrase = process.env.SEED_PHRASE
const path = `m/44'/60'/0'/0/${ACCOUNT}`
const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(seedPhrase))
const wallet = hdwallet.derivePath(path).getWallet()
const address = '0x' + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

function getAddress () {
  return address
}
function getPubkey () {
  return pubkey
}

module.exports = {getAddress, getPubkey}
