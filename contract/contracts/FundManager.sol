pragma solidity 0.4.24;

import "./Token.sol";


contract FundManager {
    using SafeMath for uint256;

    mapping(address => uint256) public ethBalances;

    mapping(address => mapping(address => uint256)) public tokenBalances;

    event TokenDeposited(address token, address from, uint256 value);
    event TokenWithdrew(address token, address to, uint256 value);

    event Deposited(address from, uint256 value);
    event Withdrew(address to, uint256 value);

    function () public payable {
        if (msg.value > 0)
            deposit();
    }

    function depositToken(address _token, uint256 _value) public {

        Token token = Token(_token);

        token.transferFrom(msg.sender, this, _value);   

        tokenBalances[_token][msg.sender] = tokenBalances[_token][msg.sender].add(_value);    

        emit TokenDeposited(_token, msg.sender, _value);
    }

    function withdrawToken(address _token) public {
        
        Token token = Token(_token);

        uint256 value = tokenBalances[_token][msg.sender];

        tokenBalances[_token][msg.sender] = 0;   

        require(token.transfer(msg.sender, value));   

        emit TokenWithdrew(_token, msg.sender, value);
    }

    function deposit() public payable {

        ethBalances[msg.sender] = ethBalances[msg.sender].add(msg.value);

        emit Deposited(msg.sender, msg.value);
    }

    function withdraw() public {
        
        uint256 value = ethBalances[msg.sender];
        
        ethBalances[msg.sender] = 0;

        msg.sender.transfer(value);
        
        emit Withdrew(msg.sender, value);

    }

    function balanceOfToken(address _token, address _user) public view returns (uint) {
        return tokenBalances[_token][_user];
    }

    function balanceOf(address _user) public view returns (uint) {
        return ethBalances[_user];
    }


}

