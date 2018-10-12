const Swingby = artifacts.require("./Swingby.sol");
const Token = artifacts.require("./Token.sol");
const ScriptVerification = artifacts.require("./ScriptVerification.sol")
const WitnessEngine = artifacts.require("./WitnessEngine.sol")

/**
 * Deploys Swingby for usage in tests
 *
 * @param {*} rootAccount The account which will deploy Swingby
 * @returns a new Swingby() instance
 */
module.exports = async function (rootAccount) {
    let sv, we, sgb, gen, oracleAddress, swingby
    try {
        sv = await ScriptVerification.new()
        we = await WitnessEngine.new()
        sgb = await Token.new('Swingby Token', 'SGB', 18)
        allocate = await sgb.mint(rootAccount, 20000 * 10 ** 18)
        oracleAddress = "0x365ebb6bb5d399ac89a20194c9a071919785beea"
        allocate = await sgb.mint(rootAccount, 20000 * 10 ** 18)
        swingby = await Swingby.new(sv.address, we.address, oracleAddress, sgb.address)
    } catch (error) {
        console.error(error)
    }
    return swingby
}
