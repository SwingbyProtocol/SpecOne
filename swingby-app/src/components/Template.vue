<template>
  <div class="component-name">
  </div>
</template>

<style lang="stylus" scoped>
@import '~variables'

// .component-name

</style>

<script>
import storeAccess from '@mixins/storeAccess'

export default {
  mixins: [ storeAccess ],
  // ⤷ commit(path, val)  dispatch(path, val)  state  get[]
  computed:
  {
  },
  methods:
  {
  }
}
</script>
