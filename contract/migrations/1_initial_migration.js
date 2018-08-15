const Migrations = artifacts.require("./Migrations.sol");
const BTCLib = artifacts.require("./BTCLib.sol");
const ScriptVerification = artifacts.require("./ScriptVerification.sol")

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(BTCLib);
  deployer.link(BTCLib, ScriptVerification)
  deployer.deploy(ScriptVerification);
};
