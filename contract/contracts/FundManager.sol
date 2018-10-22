pragma solidity 0.4.24;

import "./Token.sol";


contract FundManager {
    using SafeMath for uint256;

    mapping(address => uint256) public balancesETH;

    mapping(address => mapping(address => uint256)) public balancesToken;

    event DepositedToken(address token, address from, uint256 value);
    event WithdrewToken(address token, address to, uint256 value);

    event DepositedETH(address from, uint256 value);
    event WithdrewETH(address to, uint256 value);

    function () public payable {
        if (msg.value > 0)
            depositETH();
    }

    /**
     * @dev
     * @param _token the address of the ERC20 token
     * @param _value the amount to deposit to this contract
     * @return void
     */
    function depositToken(address _token, uint256 _value) public {
        Token token = Token(_token);

        token.transferFrom(msg.sender, address(this), _value);

        balancesToken[_token][msg.sender] = balancesToken[_token][msg.sender].add(_value);

        emit DepositedToken(_token, msg.sender, _value);
    }

    /**
     * @dev
     * @param _token the address of the ERC20 token
     * @return void
     */
    function withdrawToken(address _token) public {
        Token token = Token(_token);

        uint256 value = balancesToken[_token][msg.sender];

        balancesToken[_token][msg.sender] = 0;

        require(token.transfer(msg.sender, value));

        emit WithdrewToken(_token, msg.sender, value);
    }

    /**
     * @dev
     * @return void
     */
    function depositETH() public payable {
        balancesETH[msg.sender] = balancesETH[msg.sender].add(msg.value);

        emit DepositedETH(msg.sender, msg.value);
    }

    /**
     * @dev
     * @return  void
     */
    function withdrawETH() public {
        uint256 value = balancesETH[msg.sender];

        balancesETH[msg.sender] = 0;

        msg.sender.transfer(value);

        emit WithdrewETH(msg.sender, value);
    }

    /**
     * @dev
     * @param _token the address of the ERC20 token
     * @param _user the user address
     * @return uint
     */
    function balanceOfToken(address _token, address _user) public view returns (uint) {
        return balancesToken[_token][_user];
    }

    /**
     * @dev
     * @param _user the user address
     * @return uint
     */
    function balanceOfETH(address _user) public view returns (uint) {
        return balancesETH[_user];
    }
}
