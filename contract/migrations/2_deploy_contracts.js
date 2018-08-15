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
    return deployer.deploy(Generator)
  }).then(async () => {
    gen = await Generator.deployed()

    return deployer.deploy(Burner, sv.address, we.address, gen.address)
  }).then(async () => {

    //const burner = await Burner.deployed()

    //const burnS = await burner.submitReq(3000000, 40000, "0x6304bef4695bb175a82064b55a465fc3918f8fe5b164d049b5afa0f0926f9704957a75030ebc531604c08876a914cd5cab7ec76ad300712c02ccc51b464fdf7e5e0667040e3b6a5bb17576a9142f5e9b3a149467d002195d790ad513eac7496aa86888ac")
    //console.log(burnS.logs)

    //const burnSs = await burner.confirmByProcessor('0xe2405318ff97adf3375cd8cd40328f07d246a5b16a26815de14c68ed8f554dca', '0x53a2efce5987fa07cd789269e61c6a1a763fa053b00188ccf010c121db3773c8')
    //console.log(burnSs.logs)

  })
}