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

  deployer.deploy(WitnessEngine).then(async () => {
    sv = await ScriptVerification.deployed()
    we = await WitnessEngine.deployed()
    return deployer.deploy(Token, '232ss', 'STG', 18)
  }).then(async () => {
    nt = await Token.deployed()

    const oracle = "0xd2330a9f6dde4715f540d1669bf75e89a1b4fbbc"
    return deployer.deploy(Generator, oracle)
  }).then(async () => {
    gen = await Generator.deployed()

    return deployer.deploy(Burner, sv.address, we.address, gen.address, oracle)
  }).then(async () => {
    const burner = await Burner.deployed()

    const setBurner = await gen.setBurner(burner.address)
  

    console.log(setBurner.logs)
  })
}