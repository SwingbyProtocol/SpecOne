const seedPhrase = process.env.SEED_PHRASE
const HDWalletProvider = require('truffle-hdwallet-provider')
// const seedPhrase = "recipe vintage differ tobacco venture federal inquiry cross pig bean adapt seven"

var ropsten = function () {
  return new HDWalletProvider(seedPhrase, 'https://ropsten.infura.io/', process.env.ACCOUNT)
}

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
    testnet: {
      host: 'localhost',
      port: 9545,
      network_id: 343,
      gas: 4680036,
      gasPrice: 10000000000
    },
    ropsten: {
      provider: ropsten(),
      network_id: 3, // Match ropsten network id
      gas: 4580036,
      gasPrice: 3000000000
    },
  }
}
