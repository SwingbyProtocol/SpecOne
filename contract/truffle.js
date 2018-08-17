const mnemonic = process.env.MNEMONIC_KEY
const HDWalletProvider = require('truffle-hdwallet-provider')
// const mnemonic = "recipe vintage differ tobacco venture federal inquiry cross pig bean adapt seven"

var ropsten = new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/', process.env.ACCOUNT)

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: 343,
      gas: 4880036,
      gasPrice: 10000000000
    },
    ropsten: {
      provider: ropsten,
      network_id: 3, // Match ropsten network id
      gas: 4580036,
      gasPrice: 3000000000
    },
  }
};