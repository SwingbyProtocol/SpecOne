import { defaultMutations } from 'vuex-easy-access'

function initialState () {
  // ❗️ properties > 1 level deep are not reset with resetStateData()
  return {
    appLoading: false,
  }
}

export default {
  state: initialState(),
  getters: {},
  mutations: defaultMutations(initialState()),
  actions: {},
}
