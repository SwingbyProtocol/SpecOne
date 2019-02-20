import { sync } from 'vuex-router-sync'

import bip39 from 'bip39'
import bitcoin from 'bitcoinjs-lib'

export default ({ app, router, Vue, store }) => {
  // @keydown.enter-strict for Japanese input enter prevention
  Vue.config.keyCodes = { 'enter-strict': 13 }

  // 'vuex-router-sync'
  store.unsyncRouter = sync(store, router)

  // window libs for developing
  window.bip39 = bip39
  window.bitcoin = bitcoin
}
