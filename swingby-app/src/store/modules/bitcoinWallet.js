import copy from 'copy-anything'
import bitcoin from 'bitcoinjs-lib'
import bip39 from 'bip39'
const crypto = require('crypto')
const hdkey = require('ethereumjs-wallet/hdkey')

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
      this._vm.$set(state.wallets, name, {name, ...payload})
      this._vm.$delete(state.wallets, 'placeholder')
    },
    addPlaceholderWallet (state) {
      this._vm.$set(state.wallets, 'placeholder', {
        privateKey: '...',
        address: '...',
        seedPhrase: '...',
        network: 'testnet',
        keyPair: {}
      })
    },
  },
  actions:
  {
    async generate ({state, commit}, seedPhrase) {
      commit('addPlaceholderWallet')
      await new Promise((resolve) => setTimeout(resolve, 10))
      if (!seedPhrase) {
        const randomBytes = crypto.randomBytes(16) // 128 bits is enough
        // your 12 word phrase
        seedPhrase = bip39.entropyToMnemonic(randomBytes.toString('hex'))
      }
      // what is accurately described as the wallet seed
      const seed = bip39.mnemonicToSeed(seedPhrase)
      // ↳ takes 1500ms
      const bitcoinNetwork = bitcoin.networks.testnet
      // senga
      const hdMaster = hdkey.fromMasterSeed(seed, bitcoinNetwork) // seed from above
      const singleWallet = hdMaster.derivePath(`m/44'/60'/0'/0/0`).getWallet()
      const privKey = singleWallet.getPrivateKey()
      console.log('privKey → ', privKey)
      console.log('privKey.toString(\'hex\') → ', privKey.toString('hex'))
      const keyPair = bitcoin.ECPair.fromPrivateKey(privKey, {
        compressed: false,
        network: bitcoinNetwork
      })
      // luca
      // const hdMaster = bitcoin.bip32.fromSeed(seed, bitcoinNetwork) // seed from above
      // const keyPair = hdMaster.derivePath(`m/44'/60'/0'/0/0`)
      const privateKey = keyPair.privateKey.toString('hex')
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: bitcoinNetwork })
      // set state
      commit('setWallet', {seedPhrase, privateKey, address, keyPair, network: 'testnet'})
    },
  },
  getters:
  {
  }
}
