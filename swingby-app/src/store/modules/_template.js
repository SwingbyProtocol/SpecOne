import copy from 'copy-anything'

function initialState () {
  return copy({})
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
  },
  actions:
  {
  },
  getters:
  {
  }
}
