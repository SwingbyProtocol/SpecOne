<template>
<div class="page-index">
  <h3 class="mb-sm">BTC Wallets</h3>
  <div class="_wallet-row" v-for="(wallet, key, i) in state.bitcoinWallet.wallets" :key="key">
    <h6 class="my-sm">{{ `Wallet ${i + 1}` }}</h6>
    <div class="_table">
      <q-markup-table separator="horizontal">
        <tbody>
          <tr>
            <td class="_column1">Wallet address</td>
            <td>{{ wallet.address }}</td>
          </tr>
          <tr>
            <td>Seed phrase</td>
            <td>{{ wallet.seedPhrase }}</td>
          </tr>
          <tr>
            <td>Private key</td>
            <td>{{ wallet.privateKey }}</td>
          </tr>
          <tr>
            <td>Network</td>
            <td>{{ wallet.network }}</td>
          </tr>
        </tbody>
      </q-markup-table>
      <div class="_loading-mask" v-if="key === 'placeholder'">
        Loading...
      </div>
    </div>
  </div>
  <div>
    <q-btn class="ma-sm" color="primary" @click="newWallet()">Create random wallet</q-btn>
    <q-btn class="ma-sm" disabled>Create wallet from seed phrase</q-btn>
  </div>
  <h3 class="mb-sm">HTLC Secret</h3>
  <q-markup-table separator="horizontal" class="mb-sm" v-for="secret in secrets" :key="secret.secret">
    <tbody>
      <tr>
        <td class="_column1">Secret</td>
        <td>{{ secret.secret }}</td>
      </tr>
      <tr>
        <td>Hash</td>
        <td>{{ secret.secretHash }}</td>
      </tr>
    </tbody>
  </q-markup-table>
  <div>
    <q-btn class="ma-sm" color="primary" @click="newSecret()">Create random secret</q-btn>
  </div>
  <div class="mt-md">
    New HTLC
    <q-btn class="ma-sm" color="primary" @click="createHTLC()">Create HTLC</q-btn>
  </div>
</div>
</template>

<style lang="stylus" scoped>
@import '~variables'

// .page-index
._column1
  width 200px
._table
  position relative
  ._loading-mask
    position absolute
    left 0
    right 0
    top 0
    bottom 0
    background-color rgba(255, 255, 255, 0.5)
    display flex
    align-items center
    justify-content center
    font-size 2rem
    font-weight 500
    color #424242

</style>

<script>
import storeAccess from '@mixins/storeAccess'
import bitcoin from 'bitcoinjs-lib'
import createHTLC from '../helpers/createHTLC'
const crypto = require('crypto')

export default {
  mixins: [ storeAccess ],
  // ⤷ commit(path, val)  dispatch(path, val)  state  get[]
  data () {
    return {
      secrets: [],
    }
  },
  methods: {
    newWallet (seed) {
      this.dispatch('bitcoinWallet/generate', seed)
    },
    newSecret () {
      const secret = crypto.randomBytes(32)
      const secretHash = bitcoin.crypto.sha256(secret)
      this.secrets.push({
        secret: secret.toString('hex'),
        secretHash: secretHash.toString('hex')
      })
    },
    async createHTLC () {
      const secretRHashHex = this.secrets[0].secretHash
      const endTime = undefined // now
      const senderPubkey = this.state.bitcoinWallet.wallets['wallet-1'].keyPair.publicKey
      const receiverPubkey = this.state.bitcoinWallet.wallets['wallet-2'].keyPair.publicKey
      const testnet = true
      const htlc = await createHTLC(secretRHashHex, endTime, senderPubkey, receiverPubkey, testnet)
      console.log('htlc → ', htlc)
    },
  }
}
</script>
