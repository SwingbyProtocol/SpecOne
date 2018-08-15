// Abstract contract for the full ERC 20 Token standard
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
pragma solidity 0.4.24;


contract GeneratorInterface {
    function getDeptByOrder(uint _orderId) public view returns (uint, address);
    function confirmByBurner(uint _orderId) public;
    function getBTCT() public view returns (address);
}