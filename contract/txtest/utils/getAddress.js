const hdkey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')

function initWallet (accountNr) {
  const seedPhrase = process.env.SEED_PHRASE
  if (!seedPhrase) return console.error('No seed phrase. Please set the env \'SEED_PHRASE\'.')
  const ACCOUNT = process.env.ACCOUNT
  const account = (typeof accountNr === 'number') ? accountNr : ACCOUNT
  if (account === undefined) return console.error('No account. Please set the env \'ACCOUNT\' or pass an account number as argument.')
  const path = `m/44'/60'/0'/0/${account}`
  const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(seedPhrase))
  const wallet = hdwallet.derivePath(path).getWallet()
  const address = '0x' + wallet.getAddress().toString('hex')
  const pubkey = wallet.getPublicKeyString()
  return {pubkey, address}
}

function getAddress (accountNr) {
  return initWallet(accountNr).address
}

function getPubkey (accountNr) {
  return initWallet(accountNr).pubkey
}

module.exports = {getAddress, getPubkey}
