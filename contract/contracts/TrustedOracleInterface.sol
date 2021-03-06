pragma solidity 0.5.0;


contract TrustedOracleInterface {
    function add(uint _nowPrice) public returns (bool);
    function getPrice() public view returns (uint);
    function getPriceProxy(address _who) public view returns (uint);
}