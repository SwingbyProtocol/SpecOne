const hdkey = require("ethereumjs-wallet/hdkey")
const bip39 = require("bip39");
const Generator = artifacts.require("./Generator.sol")
const Burner = artifacts.require("./Burner.sol")
//const Oracle = artifacts.require("./Oracle.sol")

const mnemonic = process.env.MNEMONIC_KEY;

const path = `m/44'/60'/0'/0/${process.env.ACCOUNT}`;

const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
const wallet = hdwallet.derivePath(path).getWallet();

const address = "0x" + wallet.getAddress().toString('hex')
const pubkey = wallet.getPublicKeyString()

console.log(`your address is: ${address}`)
console.log(`pubkey: ${pubkey}`)

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
            deposited(result.args)
        if (result.event == 'SubmittedAuction')
            submittedAuction(result.args)
        if (result.event == 'StartedAuction')
            startedAuction(result.args)
        if (result.event == "SubmittedOrder")
            submittedOrder(result.args)
        if (result.event == "CanceledAuction")
            canceledAuction(result.args)
        if (result.event == "ConfirmedBySeller")
            confirmedBySeller(result.args)
        if (result.event == "ConfirmedByWitness")
            confirmedByWitness(result.args)
        if (result.event == "Bid")
            bid(result.args)
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
    })


}

function deposited(contract, args) {
    log(contract, `Deposited by: ${args._from} ${args._value.toNumber() / 1e18} `)
    showBalance(contract, args._from, args)
}


function submittedOrder(args) {
    log(contract, `SubmittedOrder ID: ${args._id_o.toNumber()}, ID_A: ${args._id_a.toNumber()}, ethBuyer:${args._ethBuyer} aOfSat: ${args._aOfSat.toNumber() /1e18}`)
    log(contract, `SubmittedOrder TxId =: ${args._txId}`)
    log(contract, `SubmittedOrder SecretHash =: ${args._secretHash}`)
    showBalance(args._ethBuyer, args)
}

function startedAuction(args) {
    log(contract, `StartedAuction ID: ${args._id_a.toNumber()} startTime : ${args._startTime.toNumber()} endTime: ${args._endTime.toNumber()}`)
    log(contract, `StartedAuction Auction deployed  =: ${args._deployed}`)
    getAuctionStatus(args._deployed)
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


function confirmedByWitness(args) {
    log(contract, `ConfirmedByWitness ID: ${args._id_o.toNumber()} Witness: ${args._witness}`)
}

async function getAuctionStatus(address) {
    auction = await DutchAuction.at(address)

    const price = await auction.price.call()
    const missingFundsToEndAuction = await auction.missingFundsToEndAuction.call()
    const totalReceivedSat = await auction.totalReceivedSatoshi.call()
    const auctionStatus = await auction.status.call()

    log(contract, `Set Auction: ${auction.address}`)
    log(contract, `get priceOfETH =: ${price} sat = ${price/1e18} BTC`)
    log(contract, `missingFundsToEndAuction=: ${missingFundsToEndAuction/1e18} BTC`)
    log(contract, `TotalReceivedSat =: ${totalReceivedSat/1e18} BTC`)
    log(contract, `Status =: ${auctionStatus.toNumber()}`)

    if (!panel) {
        panel = true;
        setInterval(() => {
            getAuctionStatus(auction.address)
        }, 4000)
    }

}


async function showBalance(contract, account, args) {
    const balance = await contract.balanceOf(account)
    log(contract, `ETH balance : ${account} ${balance.toNumber() /1e18}`)
}

function log(contract, message) {
    console.log(`${new Date()} Contract: ${contract.address} msg: ${message} @${contract.name}`)
}


function submittedRequest(contract, args) {
    log(contract, `SubmittedRequest ID: ${args._reqId.toNumber()}, ${args._user} aOfSat:${args._aOfSat.toNumber()} minLock =: ${args._mLockAmount.toNumber() /1e18} aOfWei: ${args._aOfWei.toNumber() / 1e18}`)
    log(contract, `SubmittedRequest pubkey: ${args._pubkey}`)
    showBalance(contract, args._user, args)
}