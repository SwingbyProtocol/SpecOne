# Swingby

```bash
cd ./contract
truffle compile
./rpcrun.bash
truffle migrate --reset --network development
```

test generating BTCT

下記parameterをpass可能にする
```bash
# from /txtest/ethtx
truffle exec submitOrder.js 1e18 pubKey # 1BTCTを注文
# get orderId
truffle exec confirmByLender.js orderId txId
truffle exec confirmByWitness.js orderId rawTx #無い
truffle exec mint.js orderId
```

test burning BTCT

```bash
truffle exec depositSGB.js orderId
truffle exec depositBTCT.js orderId
truffle exec submitBurn.js orderId
truffle exec burn.js orderId sS
```
