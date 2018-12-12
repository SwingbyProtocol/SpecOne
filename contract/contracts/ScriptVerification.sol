pragma solidity 0.5.0;

import "./BTCLib.sol";


contract ScriptVerification {

    event Verified(bytes32 txId, uint amount);

    /**
     * @dev
     * @param _rawTx _rawTx
     * @param _txId _txId
     * @param _beneficially _beneficially
     * @param _amount _amount
     * @param _fee _fee
     * @return boolean
     */
    function verifyTx(
        bytes _rawTx,
        bytes32 _txId,
        bytes20 _beneficially,
        uint _amount,
        uint _fee
    )
        public returns (bool)
    {
        uint doubleHash = uint(sha256(abi.encodePacked(sha256(_rawTx))));
        bytes32 txId = bytes32(flip32Bytes(doubleHash));

        if (txId != _txId) {
            return false;
        }
        bytes20 outputAddress1;
        bytes20 outputAddress2;
        uint    outputAmount1;
        uint    outputAmount2;
        bool    status1 = false;
        bool    status2 = false;

        (outputAmount1, outputAddress1, outputAmount2, outputAddress2) = BTCLib.getFirstTwoOutputs(_rawTx);

        if (outputAddress1 == _beneficially) {
            status1 = checkValue(outputAmount1, _amount, _fee);
        }

        if (outputAddress2 == _beneficially) {
            status2 = checkValue(outputAmount2, _amount, _fee);
        }

        if (!status1 && !status2)
            return false;

        if (status1 && status2)
            return false;

        emit Verified(txId, satToValue(outputAmount1));

        return true;
    }

    /**
     * @dev
     * @param _redeemScript _redeemScript
     * @return (byptes20, bytes32)
     */
    function redeemScriptToSecretHash(bytes _redeemScript) public pure returns (bytes20, bytes32) {
        bytes32 secretHash;
        bytes20 rsHash = hash160(_redeemScript);
        //stack => OP_IF, 0x04, locktime<4byte>, OP_CHECKLOCKTIMEVERIFY, OP_DROP, OP_SHA256, 0x20<32byte>
        uint index = 10;
        uint val;
        for (uint i = index; i < index + 32; i++) {
            val *= 256;
            if (i < _redeemScript.length)
                val |= uint8(_redeemScript[i]);
        }
        secretHash = bytes32(val);

        return (rsHash, secretHash);
    }

    /**
     * @dev convert an unsigned integer from little-endian to big-endian representation
     * @param _input little-endian value
     * @return input value in big-endian format
     */
    function flip32Bytes(uint _input) internal pure returns (uint result) {
        assembly {
            let pos := mload(0x40)
            for { let i := 0 } lt(i, 32) { i := add(i, 1) } {
                mstore8(add(pos, i), byte(sub(31, i), _input))
            }
            result := mload(pos)
        }
    }

    /**
     * @dev
     * @param str str
     * @return bytes20
     */
    function hash160(bytes str) internal pure returns (bytes20) {
        return ripemd160(abi.encodePacked(sha256(str)));
    }

    /**
     * @dev
     * @param _sat _sat
     * @return uint
     */
    function satToValue(uint _sat) internal pure returns (uint) {
        return _sat * 10 ** 10;
    }

    /**
     * @dev
     * @param _target _target
     * @param _amount _amount
     * @param _fee _fee
     * @return boolean
     */
    function checkValue(uint _target, uint _amount, uint _fee) internal pure returns (bool) {
        if (satToValue(_target) == _amount + _fee) {
            return true;
        }
        return false;
    }
}
