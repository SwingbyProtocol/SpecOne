import copy from 'copy-anything'
import bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
const crypto = require('crypto')
// const Buffer = require('buffer').Buffer

function initialState () {
  return copy({
    wallets: {
      // name: {
      //   privateKey: '',
      //   address: '',
      //   seedPhrase: '',
      //   network: '',
      //   keyPair: {}
      // },
    },
    count: 0
  })
}

export default {
  namespaced: true,
  state: initialState(),
  mutations:
  {
    resetStateData (state) {
      const newState = initialState()
      Object.assign(state, newState)
    },
    setWallet (state, payload) {
      state.count++
      const name = 'wallet-' + state.count
      this._vm.$set(state.wallets, name, payload)
    },
  },
  actions:
  {
    generate ({state, commit}, seedPhrase) {
      if (!seedPhrase) {
        // what you describe as 'seed'
        const randomBytes = crypto.randomBytes(16) // 128 bits is enough
        // your 12 word phrase
        seedPhrase = bip39.entropyToMnemonic(randomBytes.toString('hex'))
      }
      // what is accurately described as the wallet seed
      const seed = bip39.mnemonicToSeed(seedPhrase) // you'll use this in #3 below
      const bitcoinNetwork = bitcoin.networks.testnet
      const hdMaster = bitcoin.bip32.fromSeed(seed, bitcoinNetwork) // seed from above
      const keyPair = hdMaster.derivePath('m/0')
      const privateKey = keyPair.privateKey.toString('hex')
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey })
      // set state
      commit('setWallet', {seedPhrase, privateKey, address, keyPair, network: 'testnet'})
    },
  },
  getters:
  {
  }
}
