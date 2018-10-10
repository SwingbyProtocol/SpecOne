pragma solidity 0.4.24; 


contract Config {

    uint public feeOfSGB;
    uint public liquidationRatio;
    uint public minSerurityDeposit;
    uint public borrowerSeruityDeposit;

    constructor() public {
        liquidationRatio = 140;
        borrowerSeruityDeposit = 3000;
        minSerurityDeposit = 3000;

    }

}