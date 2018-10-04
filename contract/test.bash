#!/bin/bash

ACCOUNT=0 truffle exec txtest/gen/deposit.js 

ACCOUNT=0 truffle exec txtest/gen/deposit.js 

ACCOUNT=0 truffle exec txtest/gen/depositSGB.js 

ACCOUNT=0 truffle exec txtest/gen/submitOrder.js 

#ACCOUNT=0 ID=0 truffle exec txtest/gen/takeOrder.js 

#ACCOUNT=0 ID=0 truffle exec txtest/gen/confirmedBySubmitter.js

#ACCOUNT=0 ID=0 truffle exec txtest/gen/finalize.js

