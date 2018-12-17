pragma solidity 0.5.0;


contract AddressManager {

    /**
     * @dev
     * @param _user _user
     * @param _pubkey _pubkey
     * @return boolean
     */
    function checkUserPubkey(address _user, bytes memory _pubkey) public pure returns (bool) {
        bytes32 pointX;
        bytes32 pointY;

        assembly {
            pointX := mload(add(_pubkey, 32))
            pointY := mload(add(_pubkey, 64))
        }

        return checkEthPubKey(_user, pointX, pointY);
    }

    /**
     * @dev
     * @param user user
     * @param publicXPoint publicXPoint
     * @param publicYPoint publicYPoint
     * @return boolean
     */
    function checkEthPubKey(
        address user,
        bytes32 publicXPoint,
        bytes32 publicYPoint
    )

    /**
     * @dev
     * @return boolean
     */
    public pure returns(bool) {
        uint hashBytes = uint(keccak256(abi.encodePacked(publicXPoint, publicYPoint)));
        return hashBytes & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF == uint(user);
    }
}