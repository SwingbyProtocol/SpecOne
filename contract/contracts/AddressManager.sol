pragma solidity 0.4.24;


contract AddressManager {

    /**
     * @dev
     * @param _user
     * @param _pubkey
     * @return boolean
     */
    function checkUserPubkey(address _user, bytes _pubkey) public pure returns (bool) {
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
     * @param user
     * @param publicXPoint
     * @param publicYPoint
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