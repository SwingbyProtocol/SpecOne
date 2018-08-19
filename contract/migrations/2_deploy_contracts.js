const Burner = artifacts.require("./Burner.sol");
const Token = artifacts.require("./Token.sol");
const Generator = artifacts.require("./Generator.sol")
const ScriptVerification = artifacts.require("./ScriptVerification.sol")
const WitnessEngine = artifacts.require("./WitnessEngine.sol")


module.exports = function (deployer) {

  let sv
  let we
  let nt
  let gen
  let oracleAddress

  deployer.deploy(WitnessEngine).then(async () => {
    sv = await ScriptVerification.deployed()
    we = await WitnessEngine.deployed()
    return deployer.deploy(Token, '232ss', 'STG', 18)
  }).then(async () => {
    nt = await Token.deployed()

    oracleAddress = "0xe17a43439b750f742c7e2d675d272ee15f8be638"
    return deployer.deploy(Generator, oracleAddress)
  }).then(async () => {
    gen = await Generator.deployed()

    return deployer.deploy(Burner, sv.address, we.address, gen.address, oracleAddress)
  }).then(async () => {
    const burner = await Burner.deployed()

    const setBurner = await gen.setBurner(burner.address)

  })
}