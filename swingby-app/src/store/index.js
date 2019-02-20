import Vue from 'vue'
import Vuex from 'vuex'

import initStore from './root'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store(initStore())
  window.store = Store
  return Store
}
