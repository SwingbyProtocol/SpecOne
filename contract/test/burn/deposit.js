const deploySwingby = require('../deploySwingby')

contract('Swingby', function ([root, ...accounts]) {
    it("should deposit 44 ETH to the contract", async function () {
        try {
            swingby = await deploySwingby(root)
            const deposit = await swingby.depositETH({
                value: web3.toWei(44, 'ether'),
                from: root
            })
            const depositValue = deposit.logs[0].args.value
            const balance = await swingby.balanceOfETH(root)
            assert.equal(balance.toNumber(), 44000000000000000000, "")
            assert.equal(depositValue.toNumber(), 44000000000000000000, "")
        } catch (error) {
            console.error(error)
        }
    })
})
