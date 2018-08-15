pragma solidity 0.4.24;

import "./FundManager.sol";
import "./AddressManager.sol";
import "./Token.sol";


contract Generator is FundManager, AddressManager {

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
        bool    isOpen;
    }

    Order[] private orders;

    Token private btct;

    address private burner;

    event OrderSubmitted(uint _orderId, uint _aOfSat, bytes _pubkey);
    event ConfirmedByDepositor(bytes32 _secretHash, bytes32 _txId, address _depositor);
    event Finalized(uint _orderId, uint _verifiedTime);
    event ConfirmedByBurner(uint _orderId);
    event MintedBTCT(uint _orderId, address _submitter, uint _aOfSat);
    event Executed(uint _orderId, address _depositor, uint _aOfSat);

    constructor() public { 
        btct = new Token("TOKENX", "SGW", 18);
    }

    function setBurner(address _burner) public {
        require(burner == 0x0);
        burner = _burner;
    }

    function submitOrder(uint _aOfSat, uint _aOfWei, bytes _pubkey) public returns(bool) {
        
        require(_aOfWei <= balanceOf(msg.sender));

        require(checkUserPubkey(msg.sender, _pubkey));

        Order memory order = Order({
            aOfSat: _aOfSat,
            aOfWei: _aOfWei,
            pubkey: _pubkey,
            txId: 0x0,
            secretHash: 0x0,
            submitter: msg.sender,
            depositor: 0x0,
            verifiedTime: 0,
            isMinable: false,
            isOpen: true
        });

        orders.push(order);

        ethBalances[msg.sender] -= _aOfWei;
        lockedBalances[msg.sender] += _aOfWei;

        emit OrderSubmitted(orders.length - 1, _aOfSat, _pubkey);

    }

    function confirmByDepositor(uint _orderId, bytes32 _txId, bytes32 _secretHash) public {

        Order storage order = orders[_orderId];

        require(order.depositor == 0x0);

        order.secretHash = _secretHash;
        order.txId = _txId;
        order.depositor = msg.sender;

        emit ConfirmedByDepositor(_secretHash, _txId, msg.sender);

    }

    function confirmeBySubmitter(uint _orderId) public {
        
        Order storage order = orders[_orderId];

        require(order.submitter == msg.sender);

        require(order.verifiedTime == 0);

        order.verifiedTime = 1;

    }

    // starting use btct for 2 weeeks 
    function finalize(uint _orderId, bytes _secret) public {
        
        Order storage order = orders[_orderId];

        require(order.secretHash == sha256(_secret));

        require(order.verifiedTime == 1);

        order.verifiedTime = block.timestamp;

        emit Finalized(_orderId, order.verifiedTime);
    }

    function confirmByBurner(uint _orderId) public {

        require(msg.sender == burner);

        Order storage order = orders[_orderId];

        order.isMinable = true;

        emit ConfirmedByBurner(_orderId);
    }

    function mint(uint _orderId) public {
        
        Order memory order = orders[_orderId];
        
        require(order.isMinable);

        btct.mint(order.submitter, order.aOfSat);

        emit MintedBTCT(_orderId, order.submitter, order.aOfSat);

    }

    function execute(uint _orderId) public {
        
        Order memory order = orders[_orderId];
        
        require(order.verifiedTime != 0);

        require(order.isOpen);

        if (block.timestamp >= order.verifiedTime + 2 weeks) {
            order.depositor.transfer(order.aOfWei);
            order.isOpen = false;
            emit Executed(_orderId, order.depositor, order.aOfWei);
        }
    }

    function getDeptByOrder(uint _orderId) public view returns (uint, address) {
        
        Order memory order = orders[_orderId];

        return (order.aOfSat, order.submitter);

    }

    function getBTCT() public view returns (address) {
        return address(btct);
    }

    function getLockedBalances(address _user) public view returns (uint) {
        return lockedBalances[_user];
    }
}
