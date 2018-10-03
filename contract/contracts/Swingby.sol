pragma solidity 0.4.24;

import "./ScriptVerification.sol";
import "./FundManager.sol";
import "./WitnessEngine.sol";
import "./TrustedOracleInterface.sol";


contract Swingby is FundManager {

    mapping (address => uint256) private lockedBalances;
    mapping (address => uint256) private lockedSGBBalances;
    mapping (address => uint256) private lockedBTCTBalances;
    mapping (uint => uint256) private lockedRefundBalances;
    mapping (uint => bool) private isUsed;
    mapping (address => uint) private debts;
    uint public  debtPool;
    uint private multiplexer;

    struct Order {
        uint    aOfSat;
        bytes   pubkey;
        uint    aOfWei;
        bytes20 rsHash;
        bytes32 sHash;  // send
        bytes32 rHash;  // refund
        bytes32 txId;
        address borrower;
        address lender;
        uint    interest;
        uint    sTime;
        uint    period;
        Status  status; // emum
    }

    enum Status {
        opened,
        verified,
        minted,
        canceled,
        burning,
        liquidated,
        closed
    }

    Order[] private orders;

    ScriptVerification private sv;

    WitnessEngine private we;

    Token private btct;

    TrustedOracleInterface private oracle;

    Token private sgb;

    event OrderSubmitted(uint _orderId, address _user, uint _mLockAmount, uint _aOfWei, uint _aOfSat, bytes32 _rsh, bytes _pubkey);
    event ConfirmedByLender(uint _orderId, uint _aOfSat, bytes20 _rsHash, bytes32 _sHash, bytes32 _txId, bytes _rs);
    event ConfirmedByWitness(uint _orderId, address _witness);
    event Cancelled(uint _orderId, address _borrower, bytes _sR, uint _aOfSat);
    event MintedBTCT(uint _orderId, address _borrower, uint _aOfSat);
    event BurnedBTCT(uint _orderId, address _borrower, bytes _sS, uint _aOfSat);

    constructor(address _sv, address _we, address _oracle, address _sgb) public { 
        sv = ScriptVerification(_sv);
        we = WitnessEngine(_we);
        btct = new Token("BTCTtest", "tBTCT", 18);
        oracle = TrustedOracleInterface(_oracle);
        sgb = Token(_sgb);
        multiplexer = 1 * 10 ** uint256(sgb.decimals());
        debtPool = 0;
    }

    function submitOrder(
        uint _aOfSat, 
        uint _aOfWei, 
        uint _interest, 
        uint _period, 
        bytes32 _rHash, 
        bytes _pubkey
    ) 
    public 
    {

        uint minLockAmount;
        uint period = _period;
        uint interest = _interest;

        minLockAmount = 1 * 10 ** 18 * (_aOfSat * 140 / getPrice()) / 100;
    
        if (_period <= now) {
            period = 2 weeks;
        }
        if (_interest <= 0) {
            interest = 1000; // 10% anual year
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
            sTime: 0,
            interest: interest,
            period: period,
            status: Status.opened
        });

        orders.push(order);

        emit OrderSubmitted(orders.length - 1, msg.sender, minLockAmount, _aOfWei, _aOfSat, _rHash, _pubkey);
    }

    function confirmByLender(uint _orderId, bytes32 _txId, bytes _rs, uint _aOfToken) public {
        
        Order storage order = orders[_orderId];

        bytes20 rsHash;
        bytes32 sHash;

        require(order.status == Status.opened);

        require(order.sHash == 0x0);

        require(_aOfToken >= 3000 * multiplexer);   // security deposit

        lockSecurityDeposit(msg.sender, _aOfToken);  

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

        require(order.status == Status.opened);

        require(we.isWitness(msg.sender));

        require(sv.verifyTx(_rawTx, order.txId, order.rsHash, order.aOfSat, 0));

        order.status = Status.verified;

        emit ConfirmedByWitness(_orderId, msg.sender);
    }

    function cancelOrder(uint _orderId, bytes _sR) public {
        
        require(order.borrower == msg.sender);

        Order storage order = orders[_orderId];

        if (order.status == Status.verified) {
            require(sha256(_sR) == order.rHash);
        }

        unlockCollateralDeposit(order.borrower, order.aOfWei);

        unlockSecurityDeposit(msg.sender, 3000 * multiplexer);

        order.status = Status.canceled;

        emit Cancelled(_orderId, order.borrower, _sR, order.aOfSat);

    }

    function mint(uint _orderId) public {

        require(msg.sender == order.borrower);

        Order storage order = orders[_orderId];

        require(order.status == Status.verified);

        debts[order.borrower] += order.aOfSat;

        btct.mint(order.borrower, order.aOfSat);

        order.sTime = now;

        order.status = Status.minted;

        emit MintedBTCT(_orderId, order.borrower, order.aOfSat);
    }

    function submitBurn(uint _orderId) public {
        
        require(order.borrower == msg.sender);

        Order storage order = orders[_orderId];
        
        require(balanceOfToken(btct, order.borrower) >= order.aOfSat);

        tokenBalances[btct][order.borrower] -= order.aOfSat;

        lockedBTCTBalances[order.borrower] += order.aOfSat;

        order.status = Status.burning;

    }

    function burn(uint _orderId, bytes _sS) public {

        Order storage order = orders[_orderId];

        require(order.status == Status.burning);

        require(order.sHash == sha256(_sS));   // BTC send to borrower from lender

        if (debts[order.borrower] >= order.aOfSat) {
            debts[order.borrower] -= order.aOfSat;
        } else if (debts[order.borrower] < order.aOfSat) {
            debts[order.borrower] = 0;
        }

        lockedBTCTBalances[order.borrower] -= order.aOfSat;

        btct.burn(order.aOfSat);

        unlockCollateralDeposit(order.borrower, order.aOfWei);

        unlockSecurityDeposit(order.borrower, 3000 * multiplexer);
        
        // send fees to lender
        tokenBalances[sgb][order.borrower] -= 400 * multiplexer;
        tokenBalances[sgb][order.lender] += 400 * multiplexer;

        uint aOfInterest = (order.period - order.sTime) / 365 days * order.interest;
        uint aOfETH = 1 * 10 ** 18 * (order.aOfSat * 100 / getPrice()) / 100;

        ethBalances[order.borrower] -= (aOfETH + aOfInterest);
        ethBalances[order.lender] += (aOfETH + aOfInterest);

        order.status = Status.closed;

        emit BurnedBTCT(_orderId, order.borrower, _sS, order.aOfSat);
    }

    function liquidateByTime(uint _orderId) public returns (bool) {

        Order storage order = orders[_orderId];

        require(order.status == Status.minted);

        require(now >= order.period);
            
        liquidate(order, _orderId);

        return true;
    }

    function liquidateByPrice(uint _orderId) public returns (bool) {

        Order storage order = orders[_orderId];

        require(order.status == Status.minted);

        uint limit = 1 * 10 ** 18 * (order.aOfSat * 135 / getPrice()) / 100;

        if (order.aOfWei < limit) {
            liquidate(order, _orderId);
        }
        return true;
    }
    
    // keeper execute
    function exchange(uint _aOfSat) public {
        
        require(balanceOfToken(btct, msg.sender) >= _aOfSat);

        tokenBalances[btct][msg.sender] -= _aOfSat;   

        debtPool -= _aOfSat; 

        btct.burn(_aOfSat);

        uint amount = 1 * 10 ** 18 * (_aOfSat * 103 / getPrice()) / 100;

        msg.sender.transfer(amount);
    }

    function purge(uint _orderId, bytes _sR) public {

        Order storage order = orders[_orderId];

        require(order.status == Status.liquidated);
        
        require(sha256(_sR) == order.rHash);

        ethBalances[order.borrower] += lockedRefundBalances[_orderId];

        lockedRefundBalances[_orderId] = 0;

        order.status = Status.closed;
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

    function liquidate(Order _order, uint _orderId) internal returns (bool) {
            
        unlockCollateralDeposit(_order.borrower, _order.aOfWei);

        unlockSecurityDeposit(_order.borrower, 3000 * multiplexer);

        ethBalances[_order.borrower] -= _order.aOfWei;

        uint aOfRefundLock = 1 * 10 ** 18 * (_order.aOfSat * 25 / getPrice()) / 100;

        lockedRefundBalances[_orderId] += aOfRefundLock;

        debtPool += _order.aOfSat;

        _order.status = Status.liquidated;
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
