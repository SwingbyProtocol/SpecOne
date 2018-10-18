pragma solidity 0.4.24;


contract Config {

    uint public feeSGB;
    uint public liquidationRatio;
    uint public minSecurityDepositSGB;
    uint public borrowerSecurityDepositSGB;

    constructor() public {
        liquidationRatio = 140;
        borrowerSecurityDepositSGB = 3000;
        minSecurityDepositSGB = 3000;

    }

}