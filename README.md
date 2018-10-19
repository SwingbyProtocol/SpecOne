# Swingby


## Testing locally

Testing out on a local network is easy with truffle and our custom made swingby-cli. Here I will go over the steps to do so.

### Dependencies

We'll need truffle (< 4.1.14) installed globally. You can check the version with `truffle version`.

```bash
npm i -g truffle@latest
```

### Setup environment

First we'll setup our test network and compile and migrate our contracts.

```bash
pwd # make sure you are in the main Swingby folder
cd ./contract
npm run dev
npm run compile
npm run migrate
```

First let's check the balances of the Swingby contract and users, and let's prepare some deposits.

```bash
# BOB
swingby check-balance
# ALICE
# to change account: -a 1
swingby check-balance -a 1
# BOB
swingby deposit-sgb 6000
swingby check-balance
# ALICE
swingby deposit-sgb 6000 -a 1
swingby deposit-eth 24 -a 1
swingby check-balance -a 1
```

Alice wants to create 0.02 BTCT. Herefor she'll need a secret phrase that Bob will use to create an HTLC. First she'll create her secret:

```bash
# returns:
f0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5
```

Next Alice will need to submit the order. Alice will order 0.02 BTCT so needs to calculate how much ETH collateral she'll be allocating for the creation of the BTCT. First she'll check the current BTC price:

```bash
swingby get-price-oracle
```

She sees that the current value of BTC against ETH is at 0.034. That means that 0.02 BTC would be about `0.02 / 0.034 = 0.59 ETH`. She decides to go with 1 ETH collateral for her 0.02 BTCT order. She will need to pass a secret as well.

```bash
swingby get-secret
# returns 'f0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5'
# todo: cli
```

And puts it all together in an order like so:

```bash
swingby submit-order 0.02 --collateral 1 --sr 'f0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5'
```

Now we have our order registered inside Swingby and have received an order ID.

Next up is Bob, he sees our order and decides to lend Alice 0.02 BTC. Bob now will need to make an HTLC with Alice's secret. For this we'll be using the mHTLC library.

```bash
node htlctest.js 'f0f9862aeb53fb6bd587fa22d9e6705ca5c5c0ab2af67bba5042f2dc16d536e5'
# todo: make sR passable
```

Now the next step is for Bob to accept the order and pass the required parameters. Some parameters are to be copied from the mHTLC script. The HTLC txId (pass as `--txid`) and the redeem script (`--rs`). Of course he'll also need Alice's order ID (`--id`) and an amount of SGB to lock up. (`--sgb`)

```bash
swingby confirm-by-lender --id 'orderId' --txid 'txId' --rs 'redeemScript' --sgb 3000
# todo: add extra params
```

Alice sees Bob's HTLC and confirms.

```bash
swingby confirm-by-witness --id 'orderId' --rawtx 'rawTx'
```

Now she can mint her BTCT!

```bash
swingby mint --id 'orderId'
swingby check-balance
```

test burning BTCT

```bash
swingby deposit-sgb --id 'orderId'
swingby deposit-btct --id 'orderId'
swingby submit-burn --id 'orderId'
swingby burn --id 'orderId' --sS 'ntsmnt'
swingby check-balance
```
