const FundManager = artifacts.require("./FundManager.sol");
const Token = artifacts.require("./Token.sol")

contract('FundManager', function (accounts) {
  it("should put 100 ether in to the contract", async function () {

    token = await Token.new("SwingbyToken", "SGB", 18)
    fm = await FundManager.new()

    const mint = await token.mint(accounts[0], 50000 * 1e18)

    initialBalance = await web3.eth.getBalance(accounts[0])
    const deposit = await fm.depositETH({
      value: web3.toWei(100, 'ether')
    })
    //console.log(deposit.logs)
    const balance = await fm.balanceOfETH(accounts[0])
    assert.equal(web3.toWei(100, 'ether'), balance.toNumber(), "");
  });
  it("should withdraw 100 ether from the contract", async function () {

    const withdrew = await fm.withdrawETH()

    //console.log(withdrew.logs)
    const balance = await fm.balanceOfETH(accounts[0])
    assert.equal(0, balance.toNumber(), "");

  });

  it("should put 4000 token in to the contract", async function () {


    const approve = await token.approve(fm.address, web3.toWei(4000, 'ether'))
    const deposit = await fm.depositToken(token.address, web3.toWei(4000, 'ether'))


    //console.log(deposit.logs)
    const balance = await fm.balanceOfToken(token.address, accounts[0])
    assert.equal(web3.toWei(4000, 'ether'), balance.toNumber(), "");
  });

  it("should withdraw 4000 token from the contract", async function () {


    const withdrew = await fm.withdrawToken(token.address)

    //console.log(withdrew.logs)
    const balance = await fm.balanceOfToken(token.address, accounts[0])
    assert.equal(0, balance.toNumber(), "");
  });
})
