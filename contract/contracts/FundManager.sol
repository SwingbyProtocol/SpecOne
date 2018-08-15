pragma solidity 0.4.24;

import "./EIP20Interface.sol";


contract FundManager {

    mapping(address => uint256) public ethBalances;

    mapping(address => mapping(address => uint256)) public tokenBalances;

    event DepositedToken(address _token, address _from, uint256 _value);
    event WithdrewToken(address _token, address _to, uint256 _value);

    event Deposited(address _from, uint256 _value);
    event Withdrew(address _to, uint256 _value);

    function () public payable {
        if (msg.value > 0)
            deposit();
    }

    function depositToken(address _token, uint256 _value) public {

        EIP20Interface token = EIP20Interface(_token);

        token.transferFrom(msg.sender, this, _value);   

        tokenBalances[_token][msg.sender] += _value;    

        emit DepositedToken(_token, msg.sender, _value);
    }

    function withdrawToken(address _token) public {
        
        EIP20Interface token = EIP20Interface(_token);

        uint256 value = tokenBalances[_token][msg.sender];

        tokenBalances[_token][msg.sender] = 0;   

        require(token.transfer(msg.sender, value));   

        emit WithdrewToken(_token, msg.sender, value);
    }

    function deposit() public payable {

        ethBalances[msg.sender] += msg.value;

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

