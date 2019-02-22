import bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
const crypto = require('crypto')

const pathBtcTestnet = `m/44'/1'/0'/0/0`
const pathBtc = `m/44'/0'/0'/0/0`
// const pathEth = `m/60'/0'/0'/0/0`

/**
 * Generate a Bitcoin wallet from a seedPhrase or at random.
 *
 * @export
 * @param {string} [seedPhrase='']
 * @param {string} [_network='mainnet']
 * @returns {object} returns {adress: string, keyPair: object}
 */
export function generateBtcWallet (seedPhrase = '', _network = 'mainnet') {
  const path = (_network === 'mainnet')
    ? pathBtc
    : pathBtcTestnet
  const network = (_network === 'mainnet')
    ? bitcoin.networks.mainnet
    : bitcoin.networks.testnet
  seedPhrase = seedPhrase.trim()
  if (!seedPhrase) {
    const randomBytes = crypto.randomBytes(16) // 128 bits is enough
    // your 12 word phrase
    seedPhrase = bip39.entropyToMnemonic(randomBytes.toString('hex'))
  }
  // the wallet seed:
  const seed = bip39.mnemonicToSeed(seedPhrase) // takes 1500ms
  const hdMaster = bitcoin.bip32.fromSeed(seed, network)
  const keyPair = hdMaster.derivePath(path)
  const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network })
  return {
    seedPhrase,
    address,
    keyPair
  }
}
