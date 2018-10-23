# Swingby


## Testing locally

Testing out on a local network is easy with truffle and our custom made swingby-cli. Here I will go over the steps to do so.

### Dependencies

We'll need truffle (< 4.1.14) installed globally. You can check the version with `truffle version`.

```bash
npm i -g truffle@latest
```

### Setup environment

First we'll setup our test network and compile and migrate our Oracle contract.

```bash
# Swingby
pwd
# make sure you are in the Swingby/contract folder
npm run dev
# Go to: Trusted Oracle
pwd
# make sure you are in the TrustedOracle/contract folder
npm run compile
npm run migrate
```

First, check the oracle contract's address and copy it. Then in the Swingby folder we need to paste the oracle address before deploying these contracts to the network. Then we'll migrate and compile our Swingby contracts.

Go to `Swingby/contract/migrations/2_deploy_contracts.js` and paste the `oracleAddress`. Then compile & migrate like so:

```bash
pwd
# make sure you are in the Swingby/contract folder
npm run compile
npm run migrate
```

Then we set up a watcher for our Swingby contract.

```bash
swingby watch
```

### Mint BTCT

First let's check the balances of the Swingby contract and users, and let's prepare some deposits. You can also watch the events from the watcher.

```bash
# BOB (account 0)
# ALICE (account 1)
swingby balance
# BOB
# any action will default to account 0
swingby deposit 6000 --sgb
swingby balance
# BOB will also transfer 10,000 SGB to Alice:
swingby transfer 10000 --sgb --to 1
# ALICE
# to change account: --account 1
swingby deposit 6000 --sgb --account 1
swingby deposit 24 --eth --account 1
swingby balance
```

Alice wants to create 0.02 BTCT. Next Alice will need to submit the order. Alice will order 0.02 BTCT so needs to calculate how much ETH collateral she'll be allocating for the creation of the BTCT. First she'll check the current BTC price through the Swingby oracle.

```bash
# add 0.02 to check the value of 0.02 BTC:
swingby get-price-oracle 0.02
# returns 0.02 BTC = 0.58 ETH
```

She sees that the current value of 0.02 BTC is about 0.58 ETH, so she decides to go with 1 ETH collateral for her 0.02 BTCT order.

She will need to pass the hash of a secret as well.

```bash
swingby create-secret
# returns something like '6fd333a0402e95378a527e4028c77c71ef247770cb012bb1f9e1d68a312e6120'
```

It's important she never shows her secret to anyone. Only show the secret's hash!

Alice puts it all together in an order like so:

```bash
swingby submit-order 0.02 --account 1 --collateral 1 --sr '6fd333a0402e95378a527e4028c77c71ef247770cb012bb1f9e1d68a312e6120'
swingby balance
```

Now we have our order registered inside Swingby and have received an order ID.

Next up is Bob, he sees our order and decides to lend Alice 0.02 BTC. Bob now will need to make an HTLC with Alice's secret. For this we'll be using the mHTLC library.

He needs to retrieve the secret's hash that Alice had passed, and can see that from the events.

```bash
# First set the environment SEED_PHRASE
export SEED_PHRASE='sand jump crazy forget spy ripple into clown pelican fine ride power'
node htlctest.js 0.02 '6fd333a0402e95378a527e4028c77c71ef247770cb012bb1f9e1d68a312e6120'
```

Notice the redeem script that is returned. Bob will need this later on.

Now the next step is for Bob to accept the order of Alice and pass the required parameters. He'll also need Alice's BTCT order ID (`--id`) and an amount of SGB to lock up (`--sgb`). Also the HTLC txId (pass as `--txid`) and the redeem script (`--rs`).

```bash
swingby confirm-by-lender --id 0 --lockSgb 3000 --txid '528b3d66fbaa637fbb68bac30e2ddc28647657d254c4a627b503f102af470a4e' --rs '6304a208cf5bb175a82001de12d560b54f0a883ec52b7ac3314b806b4dc99e7575e932862070bb46b4338876a9148cba053edabfaf31c24067f2e7b7d24b7770c1ef67a8206fd333a0402e95378a527e4028c77c71ef247770cb012bb1f9e1d68a312e61208876a9142f5e9b3a149467d002195d790ad513eac7496aa86888ac'
swingby balance
```

Now if we look at our watch script the order Alice and confirmation of Bob has been registered, the events have been picked up and a witness has checked Bob's HTLC. The witness has created a transaction to confirm the HTLC and this is logged where it says "HTLC confirmed!". Here you the transaction hash of the watcher can be retrieved and Alice can go and mint her BTCT!

```bash
swingby mint --id 0 --account 1
```

Finally let's check Alice's balance:

```bash
swingby balance
```

### Burn BTCT (WIP)

```bash
swingby deposit 0.02 --btct --account 1
swingby submit-burn --id 0 --account 1
swingby balance
swingby burn --id 0 --secret 'd04e8899bf4b0c88959c6074a5714a6974265cf2facaac4d761edf1ff479e7c7'
swingby balance
```
