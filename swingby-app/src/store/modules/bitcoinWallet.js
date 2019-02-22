import copy from 'copy-anything'
import { generateBtcWallet } from '@helpers/generateWallet'

function initialState () {
  return copy({
    wallets: {
      // name: {
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
        address: '...',
        seedPhrase: '...',
        network: 'testnet',
        keyPair: {}
      })
    },
  },
  actions:
  {
    async generate ({state, commit}, _seedPhrase) {
      commit('addPlaceholderWallet')
      await new Promise((resolve) => setTimeout(resolve, 10))
      const { seedPhrase, address, keyPair } = generateBtcWallet(_seedPhrase, 'testnet')
      // set state
      commit('setWallet', {seedPhrase, address, keyPair, network: 'testnet'})
    },
  },
  getters:
  {
  }
}
