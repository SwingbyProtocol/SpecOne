pragma solidity 0.4.24;

import "./ScriptVerification.sol";
import "./FundManager.sol";
import "./WitnessEngine.sol";
import "./TrustedOracleInterface.sol";


contract Swingby is FundManager {

    mapping (address => uint256) private lockedBalances;
    mapping (address => uint256) private lockedSGBBalances;
    mapping (uint => bool) private isUsed;
    mapping (address => uint) private debts;
    uint private multiplexer;

    struct Order {
        uint    aOfSat;
        bytes   pubkey;
        uint    aOfWei;
        bytes20 rsHash;
        bytes32 sHash;
        bytes32 rHash;
        bytes32 txId;
        address borrower;
        address lender;
        uint    vTime;
        uint    period;
        bool    isOpen;
    }

    Order[] private orders;

    ScriptVerification private sv;

    WitnessEngine private we;

    Token private btct;

    TrustedOracleInterface private oracle;

    Token private sgb;

    event OrderSubmitted(uint _orderId, address _user, uint _mLockAmount, uint _aOfSat, bytes32 _rsh, bytes _pubkey);
    event ConfirmedByLender(uint _orderId, uint _aOfSat, bytes20 _rsHash, bytes32 _sHash, bytes32 _txId, bytes _rs);
    event ConfirmedByWitness(uint _orderId, address _witness, uint _vTime);
    event Attached(uint _reqId, uint _orderId);
    event MintedBTCT(uint _reqId, address _submitter, uint _aOfSat);
    event Executed(uint _reqId, address _provider, bytes _secret, uint _aOfSat);

    constructor(address _sv, address _we, address _oracle, address _sgb) public { 
        sv = ScriptVerification(_sv);
        we = WitnessEngine(_we);
        btct = new Token("BTCTtest", "tBTCT", 18);
        oracle = TrustedOracleInterface(_oracle);
        sgb = Token(_sgb);
        multiplexer = 1 * 10 ** sgb.decimals();
    }

    function submitOrder(uint _aOfSat, uint _aOfWei, uint _period, bytes32 _rHash, bytes _pubkey) public {

        uint256 minLockAmount;
        uint256 period = _period;

        minLockAmount = 1 * 10 ** 18 * (_aOfSat * 150 / getPrice()) / 100;
    
        if (_period <= now) {
            period = 2 weeks;
        }

        require(_aOfWei >= minLockAmount);

        lockCollateralDeposit(msg.sender, _aOfWei);

        lockSecurityDeposit(msg.sender, 3000 * multiplexer);

        Order memory order = Order({
            aOfSat: _aOfSat,
            pubkey: _pubkey,
            aOfWei: _aOfWei,
            rsHash: 0x0,
            sHash: 0x0,
            rHash: _rHash,
            txId: 0x0,
            borrower: msg.sender,
            lender: 0x0,
            vTime: 0,
            period: period,
            isOpen: true
        });

        orders.push(order);

        emit OrderSubmitted(orders.length - 1, msg.sender, minLockAmount, _aOfWei, _aOfSat, _rHash, _pubkey);
    }

    function confirmByLender(uint _orderId, bytes32 _txId, bytes _rs, uint _aOfToken) public {
        
        Order storage order = orders[_orderId];

        bytes20 rsHash;
        bytes32 sHash;

        require(order.secretHash == 0x0);

        lockSecurityDeposit(msg.sender, 3000 * multiplexer);

        (rsHash, sHash) = sv.redeemScriptToSecretHash(_rs);

        order.rsHash = rsHash;
        order.sHash = sHash;
        order.txId = _txId;
        order.lender = msg.sender;

        emit ConfirmedByLender(_orderId, order.aOfSat, order.rsHash, order.sHash, _txId, _rs);

    }

    /**
     *  bytes _rawTx, 
        bytes32 _txId, 
        bytes20 _beneficially, 
        uint _amount, 
        uint _fee
     */
    function confirmByWitness(uint _orderId, bytes _rawTx) public {

        Order storage order = orders[_orderId];

        require(order.lender != 0x0);

        require(order.vTime == 0);

        require(we.isWitness(msg.sender));

        require(sv.verifyTx(_rawTx, order.txId, order.rsHash, order.aOfSat, 0));

        order.vTime = block.timestamp;

        emit ConfirmedByWitness(_orderId, msg.sender, order.vTime);
    }

    function mint(uint _orderId) public {

        Order storage order = orders[_orderId];

        require(order.vTime != 0);

        require(msg.sender == order.borrower);

        debts[order.borrower] += order.aOfSat;

        btct.mint(order.borrower, order.aOfSat);

        emit MintedBTCT(_orderId, order.borrower, order.aOfSat);
    }

    function burn(uint _orderId, bytes _secret) public {

        Order storage order = orders[_orderId];

        require(order.verifiedTime != 0);

        require(order.secretHash == sha256(_secret));

        require(balanceOfToken(btct, order.submitter) >= order.aOfSat);

        burnBTCT(order.submitter, order.aOfSat);

        if (debts[order.provider] >= order.aOfSat) {
            debts[order.provider] -= order.aOfSat;
        } else if (debts[order.provider] < order.aOfSat) {
            debts[order.provider] = 0;
        }
        unlockSecurityDeposit(order.submitter, order.lockingAmount);

        emit Executed(_orderId, order.provider, _secret, order.aOfSat);
    }

    function liquidateByTime(uint _orderId) public returns (bool) {

        Order storage order = orders[_orderId];

        require(req.verifiedTime != 0);

        require(block.timestamp >= req.verifiedTime + 2 weeks);

        require(req.isOpen);

        if (debts[req.provider] == 0) {
            req.isOpen = false;
            return true;
        } else if (debts[req.provider] > 0 && req.isMinter) {
            
            lockedBalances[req.submitter] = 0;
            req.isOpen = false;
            return true;
        }
        return true;
    }

    function liquidateByPrice(uint _reqId) public returns (bool) {

        Request storage req = requests[_reqId];

        require(req.verifiedTime != 0);

        uint limit = 1 * 10 ** 18 * (req.aOfSat * 135 / getPrice()) / 100;

        if (req.lockingAmount < limit) {
            lockedBalances[req.submitter] = 0;
            req.isOpen = false;
            return true;
        }
        return true;
    }

    function getPrice() public view returns (uint) {
        return oracle.getPrice();
    }

    function getDebts(address _provider) public view returns (uint) {
        return debts[_provider];
    }

    function getLockedBalances(address _user) public view returns (uint) {
        return lockedBalances[_user];
    }

    function getBTCT() public view returns (address) {
        return address(btct);
    }

    function burnBTCT(address _user, uint _amountOfSat) internal {

        require(balanceOfToken(btct, _user) >= _amountOfSat);
        
        tokenBalances[btct][_user] -= _amountOfSat;   

        btct.burn(_amountOfSat);

    }

    function lockSecurityDeposit(address _user, uint _amount) internal {
        
        require(balanceOfToken(sgb, _user) >= _amount);

        tokenBalances[sgb][_user] -= _amount;

        lockedSGBBalances[_user] += _amount;
    }

    function unlockSecurityDeposit(address _user, uint _amount) internal {
        
        require(lockedSGBBalances[_user] >= _amount);

        tokenBalances[sgb][_user] += _amount;

        lockedSGBBalances[_user] -= _amount;
    }

    function lockCollateralDeposit(address _user, uint _amount) internal {

        require(balanceOf(_user) >= _amount);

        ethBalances[_user] -= _amount;

        lockedBalances[_user] += _amount;

    }

    function unlockCollateralDeposit(address _user, uint _amount) internal {
        
        require(lockedBalances[_user] >= _amount);

        ethBalances[_user] += _amount;

        lockedBalances[_user] -= _amount;
    }
}
