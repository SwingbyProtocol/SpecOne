const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Swingby = artifacts.require("./Swingby.sol")
//const Oracle = artifacts.require("./Oracle.sol")
const bitcoin = require('bitcoinjs-lib')
const rp = require('request-promise')

const mnemonic = process.env.MNEMONICKEY;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet = hdwallet.derivePath(path).getWallet();

const address = "0x" + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

console.log(`your address is: ${address}`)
console.log(`pubkey: ${pubkey}`)


const orderPool = []

const tokenList = [
    '7320a3b01c6342c4bee8f06190f58cb8',
    '1dde05676a9f4d12812835603e296db7',
    '0ff673dba6254dfba97361daab3d0cb3',
    'f7cac23f52674f8da3136fa4bcfa7f8a',
    '64155ef406344a92a8b683780309ae90',
    '3105cce28c7f48f4984794e4977f8ab9',
    '30f9fffc43ba41b1b12a32d209293cce',
    'f3fb073f699940d9a36210c80e0485fa',
    '32abc227c3cc4edc994ce90a9c4e9a64',
    'ea0b0f7915e84aaa9e14896ca3976e9d',
    'c9933c75c0414a3dae7e81c6dc270b59',
    '2c56f78f2b814d709c50e65b76605858',
    'bb30928a174e4baa85155be91786fbf0',
    '9c1652d7156a456ea222cc4c66ff869c',
    'a7fcbee66b244c8784fdcbe709ad0c66',
    'c64dc41f768644c5b5ecd339a73df21b',
    '14a0618fa4b040c1bd0c86534fcaad02',
    'ffe8fc0c8617480bba63cc6c7bfea346',
    '0e4e15f475de47baa353c0ceb428f247',
    'ebf813b67c6e49748582cfc4f93c09d6'
]

module.exports = async function (callback) {



    burner = await Swingby.deployed()
    burner.name = Swingby.contractName

    // oracle = await Oracle.deployed()
    // oracle.name = Oracle.contractName

    panel = false;


    const burnerEvent = burner.allEvents({
        fromBlock: 0,
        toBlock: 'latest'
    })


    burnerEvent.watch(function (error, result) {
        if (error) return 0
        if (result.event == "AddedNewPrice")
            addedNewPrice(result.args)
        if (result.event == 'DepositedETH')
            deposited(burner, result.args)
        if (result.event == 'OrderSubmitted')
            orderSubmitted(burner, result.args)
        if (result.event == 'ConfirmedByLender')
            confirmedByLender(burner, result.args)
        if (result.event == "ConfirmedByWtitness")
            confirmedByWitness(burner, result.args)
        if (result.event == "Attached")
            attached(burner, result.args)
        if (result.event == "DepositedToken")
            tokenDepositedETH(burner, result.args)
        if (result.event == "BTCTBurned")
            burnExecuted(burner, result.args)
        if (result.event == "BTCTMinted")
            btctMinted(burner, result.args)
        if (result.event == "Cancelled")
            cancelled(burner, result.args)
        if (result.event == "Liquidated")
            liquidated(burner, result.args)
        if (result.event == "BurnedOnBehalf")
            burnedOnBehalf(burner, result.args)

    })


}

function deposited(contract, args) {
    log(contract, `DepositedETH by: ${args.from} ${args.value.toNumber() / 1e18}`)
    showBalance(contract, args.from, args)
}


function burnedOnBehalf(contract, args) {
    log(contract, `BurnedOnBehalf : ${args.amountOfWei.toNumber()/1e18} Keeper: ${args.keeper} burnedDebts: ${args.amountOfDebt.toNumber() /1e18} remainDebts: ${args.remainDebts.toNumber() /1e18}`)
}


function tokenDepositedETH(contract, args) {
    log(contract, `DepositedToken token = ${args.token} ${args.from} amount: ${args.value.toNumber()} ${args.value.toNumber()/1e18}`)
    showTokenBalance(contract, args.token, args.from)
}

function addedNewPrice(contract, args) {
    log(contract, `AddedNewPrice: pair: ${args.pair} price: ${args.price/1e18} priceOfEMA: ${args.priceOfEMA/1e18}`)
}


async function showBalance(contract, account, args) {
    const balance = await contract.balanceOfETH(account)
    log(contract, `ETH balance in contract : ${account} ${balance.toNumber() /1e18}`)
}

async function showTokenBalance(contract, token, account, args) {
    const balance = await contract.balanceOfToken(token, account)
    log(contract, `Token balance in contract : token: ${token} account: ${account} ${balance.toNumber()} ${balance.toNumber() /1e18}`)
}

function log(contract, message) {
    console.log(`${new Date()} Contract: ${contract.address} msg: ${message} @${contract.name}`)
}

async function getPrice(contract) {
    const price = await contract.getPrice()
    log(contract, `ETH price   : ${price.toNumber() /1e18}`)
}



async function getBTCT(contract) {
    const btct = await contract.getBTCT()
    log(contract, `BTCT address : ${btct}`)
}


async function getDebts(contract, borrower) {
    const debts = await contract.getDebts(borrower);
    log(contract, `Borrower-Debts : ${borrower} amountOfSat: ${debts.toNumber() /1e18}`)
}

async function showLiquidate(contract, args) {
    const rate = await contract.getMaintenance(args.orderId.toNumber())
    log(contract, `Liquidated ID: ${args.orderId.toNumber()}, rate: ${rate.toNumber() / 1e18} %`)
}

function liquidated(contract, args) {
    log(contract, `Liquidated ID: ${args.orderId.toNumber()}, ${args.borrower} amountOfWei: ${args.amountOfWei.toNumber()/1e18} time: ${args.liquidatedTime.toNumber()}`)
    showBalance(contract, args.borrower, args)
    showLiquidate(contract, args)
}

function orderSubmitted(contract, args) {
    log(contract, `OrderSubmitted ID: ${args.orderId.toNumber()}, ${args.user} amountOfSat: ${args.amountOfSat.toNumber()/1e18} minLock =: ${args.mLockAmount.toNumber() /1e18} amountOfWei: ${args.amountOfWei.toNumber() / 1e18}`)
    log(contract, `OrderSubmitted pubkey: ${args.pubkey}`)
    log(contract, `OrderSubmitted rHash: ${args.rHash}`)

    getPrice(contract)
    showBalance(contract, args.user, args)
}

function cancelled(contract, args) {
    log(contract, `OrderCancelled ID: ${args.orderId.toNumber()}, ${args.borrower} amountOfSat: ${args.amountOfSat.toNumber()/1e18} `)
    log(contract, `OrderCancelled sR: ${args.sR}`)
    log(contract, `OrderCancelled rHash: ${args.rHash}`)

    getPrice(contract)
    showBalance(contract, args.borrower, args)
}

function confirmedByLender(contract, args) {
    log(contract, `ConfirmedByLender ID: ${args.orderId.toNumber()} rsHash: ${args.rsHash} sHash: ${args.sHash} txId: ${args.txId}`)
    orderPool.push(args)
}

function confirmedByWitness(contract, args) {
    log(contract, `ConfirmedByWitness ID: ${args.reqId.toNumber()} Witness: ${args.witness} verifiedTime: ${args.verifiedTime.toNumber()}`)
}

function btctMinted(contract, args) {
    getBTCT(contract)
    log(contract, `BTCTMinted ID: ${args.orderId.toNumber()} borrower: ${args.borrower} amountOfSat: ${args.amountOfSat.toNumber() /1e18} Period: ${args.period.toNumber()}`)
    getDebts(burner, args.borrower)

}

function attached(contract, args) {
    log(contract, `Attached ReqID: ${args.reqId.toNumber()} OrderId: ${args.orderId.toNumber()}`)
}

function burnExecuted(contract, args) {
    log(contract, `BurnExecuted ID: ${args.orderId.toNumber()} borrower: ${args.borrower} secret: ${args.sS} amountOfSat: ${args.amountOfSat.toNumber()/1e18}`)
    getDebts(contract, args.borrower)
}

let checkHTLC = function (args, isTestnet) {
    let networkCypher
    let network
    if (isTestnet) {
        networkCypher = 'test3'
        network = bitcoin.networks.testnet
    }
    const token = tokenList[Math.floor(Math.random() * tokenList.length)]
    const uri = `https://api.blockcypher.com/v1/btc/${networkCypher}/txs/${args.txId.slice(2)}?includeHex=true&token=${token}`
    //console.log(uri)
    rp.get(uri).then(async (result) => {
        const data = JSON.parse(result)
        // console.log(data.hash, args.redeemScript.slice(2))

        if (data.hash !== args.txId.slice(2)) {
            return 0
        }
        const htlcAddress = bitcoin.payments.p2sh({
            redeem: {
                output: new Buffer(args.rs.slice(2), 'hex'),
                network: network
            },
            network: network
        })
        // console.log(htlcAddress.address)
        let isVerified = false
        data.outputs.forEach((output) => {
            //console.log(output)
            if (output.addresses[0] === htlcAddress.address) {
                if (output.value === args.amountOfSat.toNumber() / 1e10) {
                    isVerified = true
                }
            }
        })
        console.log(isVerified)
        if (isVerified) {
            try {
                log(burner, `Worker Submit: OrderID: ${args.orderId.toNumber()} hex: ${'0x' + data.hex}`)
                const confirm = await burner.confirmByWitness(args.orderId.toNumber(), '0x' + data.hex, {
                    gas: 120000
                })
                log(burner, `Worker Submitted: OrderID: ${args.orderId.toNumber()} ${confirm.tx}`)
            } catch (e) {
                log(burner, `Worker Error: OrderID: ${args.orderId.toNumber()} VM Exception while processing transaction: revert`)
            }
        }
    }).catch((err) => {
        log(burner, `Worker Error ${err.message}`)
    })
}
const loop = function () {
    setTimeout(() => {
        // console.log(orderPool)
        if (orderPool.length > 0) {
            log(burner, `Pools = ${orderPool.length}`)
            const order = orderPool.pop()
            let isTestnet = true
            checkHTLC(order, isTestnet)
        }
        loop()
    }, 4000)
}
loop()