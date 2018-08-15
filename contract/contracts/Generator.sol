pragma solidity 0.4.24;

import "./FundManager.sol";
import "./Token.sol";


contract Generator is FundManager {

    mapping (bytes32 => bool) private isUsed;
    mapping (address => uint) private lockedBalances;

    struct Order {
        uint    aOfSat;
        uint    aOfWei;
        bytes   pubkey;
        bytes32 txId;
        bytes32 secretHash;
        address submitter;
        address depositor;
        uint    verifiedTime;
        bool    isMinable;
    }

    Order[] private orders;

    Token private btct;

    address private burner;

    event Submitted(uint _aOfSat, bytes _pubkey);
    event ConfirmedByProcessor(bytes32 _reqHash, bytes32 _txId);

    constructor() public { 
        btct = new Token("TOKENX", "SGW", 18);
    }

    function setBurner(address _burner) public {
        require(burner == 0x0);
        burner = _burner;
    }

    function submitOrder(uint _aOfSat, uint _aOfWei, bytes _pubkey) public returns(bool) {
        
        require(_aOfWei <= balanceOf(msg.sender));

        Order memory order = Order({
            aOfSat: _aOfSat,
            aOfWei: _aOfWei,
            pubkey: _pubkey,
            txId: 0x0,
            secretHash: 0x0,
            submitter: msg.sender,
            depositor: 0x0,
            verifiedTime: 0,
            isMinable: false
        });

        orders.push(order);

        ethBalances[msg.sender] -= _aOfWei;
        lockedBalances[msg.sender] += _aOfWei;

        emit Submitted(_aOfSat, _pubkey);

    }

    function confirmByDepositor(uint _orderId, bytes32 _txId, bytes32 _secretHash) public {

        Order storage order = orders[_orderId];

        require(order.depositor == 0x0);

        order.secretHash = _secretHash;
        order.txId = _txId;
        order.depositor = msg.sender;

        emit ConfirmedByProcessor(_secretHash, _txId);

    }

    // starting use btct for 2 weeeks 
    function finalized(uint _orderId, bytes _secret) public {
        
        Order storage order = orders[_orderId];

        require(order.secretHash == sha256(_secret));

        order.verifiedTime = block.timestamp;

    }

    function confirmByBurner(uint _orderId) public {

        require(msg.sender == burner);

        Order storage order = orders[_orderId];

        order.isMinable = true;
    }

    function mint(uint _orderId, bytes _secret) public {
        
        Order memory order = orders[_orderId];
        
        require(order.isMinable);

        require(order.secretHash == sha256(_secret));

        require(order.submitter == msg.sender);

        btct.mint(order.submitter, order.aOfSat);

    }

    function getDeptByOrder(uint _orderId) public view returns (uint, address) {
        
        Order memory order = orders[_orderId];

        return (order.aOfSat, order.submitter);

    }
}
