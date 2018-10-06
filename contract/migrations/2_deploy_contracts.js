const Swingby = artifacts.require("./Swingby.sol");
const Token = artifacts.require("./Token.sol");
const ScriptVerification = artifacts.require("./ScriptVerification.sol")
const WitnessEngine = artifacts.require("./WitnessEngine.sol")


module.exports = function (deployer, network, accounts) {

  let sv
  let we
  let sgb
  let gen
  let oracleAddress

  deployer.deploy(WitnessEngine).then(async () => {
    sv = await ScriptVerification.deployed()
    we = await WitnessEngine.deployed()
    return deployer.deploy(Token, 'Swingby Token', 'SGB', 18)
  }).then(async () => {
    sgb = await Token.deployed()
    allocate = await sgb.mint(accounts[0], 20000 * 10 ** 18)

    oracleAddress = "0x365ebb6bb5d399ac89a20194c9a071919785beea"
    if (network == "ropsten")
      oracleAddress = "0xa2bd28f23A78Db41E49db7d7B64b6411123a8B85"

    return deployer.deploy(Swingby, sv.address, we.address, oracleAddress, sgb.address)
  })
}