pragma solidity 0.5.0;


contract Config {

    uint public feeSGB;
    uint public liquidationRatio;
    uint public minSecurityDepositSGB;
    uint public borrowerSecurityDepositSGB;

    constructor() public {
        liquidationRatio = 150;
        borrowerSecurityDepositSGB = 3000;
        minSecurityDepositSGB = 3000;
        feeSGB = 0;
    }

}