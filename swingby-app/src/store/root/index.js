import storeRoot from './root'
import bitcoinWallet from '../modules/bitcoinWallet'

export default function () {
  return {
    ...storeRoot,
    modules: {bitcoinWallet},
  }
}
