const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Generator = artifacts.require("./Generator.sol")
const Burner = artifacts.require("./Burner.sol")
//const Oracle = artifacts.require("./Oracle.sol")
const bitcoin = require('bitcoinjs-lib')
const rp = require('request-promise')

const mnemonic = process.env.MNEMONIC_KEY;

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

module.exports = async function (deployer, net, accounts) {

    gen = await Generator.deployed()
    gen.name = Generator.contractName

    burner = await Burner.deployed()
    burner.name = Burner.contractName

    // oracle = await Oracle.deployed()
    // oracle.name = Oracle.contractName

    panel = false;

    console.log(`Generator: ${gen.address} Burner: ${burner.address}`)

    const genEvent = gen.allEvents({
        fromBlock: 0,
        toBlock: 'latest'
    });

    genEvent.watch(function (error, result) {
        if (error) return 0
        //console.log(result.event, result.args);
        if (result.event == 'Deposited')
            deposited(gen, result.args)
        if (result.event == 'OrderSubmitted')
            orderSubmitted(gen, result.args)
        if (result.event == "OrderTaked")
            orderTaked(gen, result.args)
        if (result.event == "ConfirmedBySubmitter")
            confirmedBySubmitter(gen, result.args)
        if (result.event == "Finalized")
            finalized(gen, result.args)
        if (result.event == "MintedBTCT")
            mintedBTCT(gen, result.args)
        if (result.event == "Claimed")
            claimed(result.args)

    });

    const burnerEvent = burner.allEvents({
        fromBlock: 0,
        toBlock: 'latest'
    })


    burnerEvent.watch(function (error, result) {
        if (error) return 0
        if (result.event == "AddedNewPrice")
            addedNewPrice(result.args)
        if (result.event == 'Deposited')
            deposited(burner, result.args)
        if (result.event == 'SubmittedRequest')
            submittedRequest(burner, result.args)
        if (result.event == 'ConfirmedByProvider')
            confirmedByProvider(burner, result.args)
        if (result.event == "ConfirmedByWtitness")
            confirmedByWitness(burner, result.args)
        if (result.event == "Attached")
            attached(burner, result.args)
    })


}

function deposited(contract, args) {
    log(contract, `Deposited by: ${args._from} ${args._value.toNumber() / 1e18} `)
    showBalance(contract, args._from, args)
}


function orderSubmitted(contract, args) {
    log(contract, `OrderSubmitted ID: ${args._orderId.toNumber()} Submitter: ${args._submitter} aOfSat: ${args._aOfSat.toNumber() /1e18}`)
    showBalance(contract, args._submitter, args)
}

function orderTaked(contract, args) {
    log(contract, `OrderTaked ID: ${args._orderId.toNumber()} Depositor: ${args._depositor} secretHash: ${args._secretHash}`)
}


function confirmedBySubmitter(contract, args) {
    log(contract, `ConfirmedBySubmitter ID: ${args._orderId.toNumber()} Submitter: ${args._submitter} `)
}

function finalized(contract, args) {
    log(contract, `Finalized ID: ${args._orderId.toNumber()} verifiedTime: ${args._verifiedTime} `)
}


function mintedBTCT(contract, args) {
    log(contract, `MintedBTCT ID: ${args._orderId.toNumber()} Submitter: ${args._submitter} aOfSat: ${args._aOfSat.toNumber() /1e18}`)
    getDebts(burner, args._submitter)
}



function canceledAuction(args) {
    log(contract, `CanceledOrder ID: ${args._id_a.toNumber()}`)
    showBalance(args._ethSeller, args)
}


function confirmedBySeller(args) {
    log(contract, `ConfirmedBySeller ID: ${args._id_o.toNumber()}`)
}

function bid(args) {
    log(contract, `Bid ID: ${args._id_o.toNumber()} from: ${args._ethBuyer} aOfSat: ${args._aOfSat}`)
    log(contract, `Bid txId =: ${args._txId} Secret =: ${args._secret}`)
    getAuctionStatus(args._deployed)
}

function claimed(args) {
    log(contract, `Claimed ID: ${args._id_a.toNumber()} ethBuyer: ${args._ethBuyer} amount: ${args._amount/1e18}`)
}

function addedNewPrice(contract, args) {
    log(contract, `AddedNewPrice: pair: ${args._pair} price: ${args._price/1e18} priceOfEMA: ${args._priceOfEMA/1e18}`)
}


async function showBalance(contract, account, args) {
    const balance = await contract.balanceOf(account)
    log(contract, `ETH balance : ${account} ${balance.toNumber() /1e18}`)
}

function log(contract, message) {
    console.log(`${new Date()} Contract: ${contract.address} msg: ${message} @${contract.name}`)
}

async function getPrice(contract) {
    const price = await contract.getPrice()
    log(contract, `ETH price   : ${price.toNumber() /1e18}`)
}

async function getDebts(contract, provider) {
    const debts = await contract.getDebts(provider);
    log(contract, `Provider-Debts : ${provider} aOfSat: ${debts.toNumber() /1e18}`)
}

function submittedRequest(contract, args) {
    log(contract, `SubmittedRequest ID: ${args._reqId.toNumber()}, ${args._user} aOfSat: ${args._aOfSat.toNumber()/1e18} minLock =: ${args._mLockAmount.toNumber() /1e18} aOfWei: ${args._aOfWei.toNumber() / 1e18}`)
    log(contract, `SubmittedRequest pubkey: ${args._pubkey}`)
    getPrice(contract)
    showBalance(contract, args._user, args)
}

function confirmedByProvider(contract, args) {
    log(contract, `ConfirmedByProvider ID: ${args._reqId.toNumber()} rsHash: ${args._rsHash} sHash: ${args._sHash} txId: ${args._txId}`)
    orderPool.push(args)
}

function confirmedByWitness(contract, args) {
    log(contract, `ConfirmedByWitness ID: ${args._reqId.toNumber()} Witness: ${args._witness} verifiedTime: ${args._verifiedTime.toNumber()}`)
}

function attached(contract, args) {
    log(contract, `Attached ReqID: ${args._reqId.toNumber()} OrderId: ${args._orderId.toNumber()}`)
}

let checkHTLC = function (args, isTestnet) {
    let networkCypher
    let network
    if (isTestnet) {
        networkCypher = 'test3'
        network = bitcoin.networks.testnet
    }
    const token = tokenList[Math.floor(Math.random() * tokenList.length)]
    const uri = `https://api.blockcypher.com/v1/btc/${networkCypher}/txs/${args._txId.slice(2)}?includeHex=true&token=${token}`
    //console.log(uri)
    rp.get(uri).then(async (result) => {
        const data = JSON.parse(result)
        // console.log(data.hash, args._redeemScript.slice(2))

        if (data.hash !== args._txId.slice(2)) {
            return 0
        }
        const htlcAddress = bitcoin.payments.p2sh({
            redeem: {
                output: new Buffer(args._rs.slice(2), 'hex'),
                network: network
            },
            network: network
        })
        // console.log(htlcAddress.address)
        let isVerified = false
        data.outputs.forEach((output) => {
            //console.log(output)
            if (output.addresses[0] === htlcAddress.address) {
                if (output.value === args._aOfSat.toNumber() / 1e10) {
                    isVerified = true
                }
            }
        })
        console.log(isVerified)
        if (isVerified) {
            try {
                log(burner, `Worker Submit: Request_ID: ${args._reqId.toNumber()} hex: ${'0x' + data.hex}`)
                const confirm = await burner.confirmByWitness(args._reqId.toNumber(), '0x' + data.hex, {
                    gas: 120000
                })
                log(burner, `Worker Submitted: Request_ID: ${args._reqId.toNumber()} ${confirm.tx}`)
            } catch (e) {
                log(burner, `Worker Error: Request_ID: ${args._reqId.toNumber()} VM Exception while processing transaction: revert`)
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