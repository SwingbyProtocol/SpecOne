pragma solidity 0.4.24;

import "./ScriptVerification.sol";
import "./AddressManager.sol";
import "./FundManager.sol";
import "./WitnessEngine.sol";
import "./TrustedOracleInterface.sol";
import "./Config.sol";
import "./SafeMath.sol";


contract Swingby is FundManager, AddressManager, Config {
    using SafeMath for uint256;

    mapping (address => uint256) private lockedBalancesETH;
    mapping (address => uint256) private lockedBalancesSGB;
    mapping (address => uint256) private lockedBalancesBTCT;
    mapping (uint => uint256) private lockedRefundBalancesETH;
    mapping (address => uint) private debts;
    uint public  debtPool;
    uint private multiplexer;

    struct Order {
        uint    amountOfSat;
        uint    amountOfWei;
        uint    amountOfSGB;
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

    event OrderSubmitted(
        uint    orderId,
        address user,
        uint    mLockAmount,
        uint    amountOfWei,
        uint    amountOfSat,
        bytes32 rHash,
        bytes   pubkey
    );

    event OrderConfirmed(
        uint    orderId,
        uint    amountOfSat,
        bytes20 rsHash,
        bytes32 sHash,
        bytes32 txId,
        bytes   rs
    );

    event ConfirmedByWitness(
        uint    orderId,
        address witness
    );

    event Cancelled(
        uint    orderId,
        address borrower,
        bytes   sR,
        bytes32 rHash,
        uint    amountOfSat
    );

    event BTCTMinted(
        uint    orderId,
        address borrower,
        uint    amountOfSat,
        uint    period
    );

    event BTCTBurned(
        uint    orderId,
        address borrower,
        bytes   sS,
        uint    amountOfSat
    );

    event Liquidated(
        uint    orderId,
        address borrower,
        uint    liquidatedTime,
        uint    amountOfWei
    );

    event BurnSubmitted(
        uint    orderId,
        address borrower,
        uint    amountOfSat
    );

    event BurnedOnBehalf(
        address keeper,
        uint    amountOfWei,
        uint    amountOfDebt,
        uint    remainDebts
    );

    constructor(address _sv, address _we, address _oracle, address _sgb) public {
        sv = ScriptVerification(_sv);
        we = WitnessEngine(_we);
        btct = new Token("BTCTtest", "tBTCT", 18);
        oracle = TrustedOracleInterface(_oracle);
        sgb = Token(_sgb);
        multiplexer = 1 * 10 ** uint256(sgb.decimals());
        debtPool = 0;
    }

    /**
     * @dev Borrower makes an order for a BTCT loan.
     * @param _amountOfSat Requested BTCT loan amount (with 18 decimals)
     * @param _amountOfWei _amountOfWei The ETH to be used as collateral and locked in the contract
     * @param _interest _interest
     * @param _period _period
     * @param _rHash Hash of secret with which the borrower will unlock the BTC of HTLC
     * @param _pubkey _pubkey
     * @return void
     */
    function submitOrder(
        uint _amountOfSat,
        uint _amountOfWei,
        uint _interest,
        uint _period,
        bytes32 _rHash,
        bytes _pubkey
    )
        public
    {
        uint minLockAmount;

        minLockAmount = 1 * 10 ** 18 * (_amountOfSat * liquidationRatio / getPrice()) / 100;

        require(_period >= now);

        require(_interest >= 0);

        require(_interest <= 5000); // maximum 50% anual year

        require(_amountOfWei >= minLockAmount);

        require(checkUserPubkey(msg.sender, _pubkey));

        lockCollateralDeposit(msg.sender, _amountOfWei);

        lockSecurityDeposit(msg.sender, borrowerSecurityDepositSGB * multiplexer);

        Order memory order = Order({
            amountOfSat: _amountOfSat,
            amountOfWei: _amountOfWei,
            amountOfSGB: 0,
            rsHash: 0x0,
            sHash: 0x0,
            rHash: _rHash,
            txId: 0x0,
            borrower: msg.sender,
            lender: 0x0,
            sTime: 0,
            interest: _interest,
            period: _period,
            status: Status.opened
        });

        orders.push(order);

        emit OrderSubmitted(orders.length - 1, order.borrower, minLockAmount, _amountOfWei, _amountOfSat, _rHash, _pubkey);
    }

    /**
     * @dev Submit the HTLC details that was created to create for a BTCT loan. Executed by lender
     * @param _orderId BTCT loan orderId
     * @param _txId transaction ID of BTC
     * @param _rs HTLC's redeemScript
     * @param _amountOfSGB Amount of security deposit (SGB) to be locked
     * @return void
     */
    function confirmOrder(uint _orderId, bytes32 _txId, bytes _rs, uint _amountOfSGB) public {
        Order storage order = orders[_orderId];

        bytes20 rsHash;
        bytes32 sHash;

        require(order.status == Status.opened);

        require(order.sHash == 0x0);

        require(_amountOfSGB >= minSecurityDepositSGB * multiplexer);   // minimum security deposit

        lockSecurityDeposit(msg.sender, _amountOfSGB);

        (rsHash, sHash) = sv.redeemScriptToSecretHash(_rs);
        order.amountOfSGB = _amountOfSGB;
        order.rsHash = rsHash;
        order.sHash = sHash;
        order.txId = _txId;
        order.lender = msg.sender;

        emit OrderConfirmed(_orderId, order.amountOfSat, order.rsHash, order.sHash, _txId, _rs);
    }

    /**
     * @dev Witness confirms the locked BTC
     * @dev bytes _rawTx, bytes32 _txId, bytes20 _beneficially, uint _amount, uint _fee
     * @param _orderId BTCT loan orderId
     * @param _rawTx _rawTx
     * @return void
     */
    function confirmByWitness(uint _orderId, bytes _rawTx) public {
        Order storage order = orders[_orderId];

        require(order.lender != 0x0);

        require(order.status == Status.opened);

        require(we.isWitness(msg.sender));

        require(sv.verifyTx(_rawTx, order.txId, order.rsHash, order.amountOfSat, 0));

        order.status = Status.verified;

        emit ConfirmedByWitness(_orderId, msg.sender);
    }

    /**
     * @dev Borrower cancels their BTCT loan order
     * @param _orderId BTCT loan orderId
     * @param _sR secret with which the borrower will unlock the BTC of HTLC
     * @return void
     */
    function cancelOrder(uint _orderId, bytes _sR) public {
        Order storage order = orders[_orderId];

        require(order.borrower == msg.sender);

        if (order.status == Status.verified) {

            require(sha256(_sR) == order.rHash);

        } else {

            require(order.status == Status.opened);
        }

        unlockCollateralDeposit(order.borrower, order.amountOfWei);

        unlockSecurityDeposit(order.borrower, borrowerSecurityDepositSGB * multiplexer);

        unlockSecurityDeposit(order.lender, order.amountOfSGB);

        order.status = Status.canceled;

        emit Cancelled(_orderId, order.borrower, _sR, sha256(_sR), order.amountOfSat);
    }

    /**
     * @dev Borrower mints BTCT
     * @param _orderId BTCT loan orderId
     * @return void
     */
    function mint(uint _orderId) public {
        Order storage order = orders[_orderId];

        require(msg.sender == order.borrower);

        require(order.status == Status.verified);

        debts[order.borrower] = debts[order.borrower].add(order.amountOfSat);

        btct.mint(order.borrower, order.amountOfSat);

        order.sTime = now;

        order.status = Status.minted;

        emit BTCTMinted(_orderId, order.borrower, order.amountOfSat, order.period);
    }

    /**
     * @dev Add ETH collateral to your BTCT loan order
     * @param _orderId BTCT loan orderId
     * @param _amountOfWei the amount to add as collateral
     * @return void
     */
    function addCollateral(uint _orderId, uint _amountOfWei) public {
        Order storage order = orders[_orderId];

        require(msg.sender == order.borrower);

        require(order.status == Status.minted);

        lockCollateralDeposit(msg.sender, _amountOfWei);

        order.amountOfWei = order.amountOfWei + _amountOfWei;
    }


    /**
     * @dev Borrower requests to burn BTCT
     * @param _orderId BTCT loan orderId
     * @return void
     */
    function submitBurn(uint _orderId) public {
        Order storage order = orders[_orderId];

        require(order.borrower == msg.sender);

        require(balanceOfToken(btct, order.borrower) >= order.amountOfSat);

        balancesToken[btct][order.borrower] = balancesToken[btct][order.borrower].sub(order.amountOfSat);

        lockedBalancesBTCT[order.borrower] = lockedBalancesBTCT[order.borrower].add(order.amountOfSat);

        order.status = Status.burning;

        emit BurnSubmitted(_orderId, order.borrower, order.amountOfSat);
    }

    /**
     * @dev Lender accepts the burn request to burn BTCT
     * @param _orderId BTCT loan orderId
     * @param _sS The secret that the lender of BTCT used to lock BTC inside an HTLC
     * @return void
     */
    function burn(uint _orderId, bytes _sS) public {
        Order storage order = orders[_orderId];

        require(order.status == Status.burning);

        //require(order.sHash == sha256(_sS));   // BTC send to borrower from lender

        if (debts[order.borrower] >= order.amountOfSat) {
            debts[order.borrower] = debts[order.borrower].sub(order.amountOfSat);
        } else if (debts[order.borrower] < order.amountOfSat) {
            debts[order.borrower] = 0;
        }

        lockedBalancesBTCT[order.borrower] = lockedBalancesBTCT[order.borrower].sub(order.amountOfSat);

        btct.burn(order.amountOfSat);

        unlockCollateralDeposit(order.borrower, order.amountOfWei);

        unlockSecurityDeposit(order.borrower, borrowerSecurityDepositSGB * multiplexer);

        unlockSecurityDeposit(order.lender, order.amountOfSGB);

        // send fees to lender
        balancesToken[sgb][order.borrower] = balancesToken[sgb][order.borrower].sub(feeSGB.mul(multiplexer));
        balancesToken[sgb][order.lender] = balancesToken[sgb][order.lender].add(feeSGB.mul(multiplexer));

        uint amountOfInterest = (order.period - order.sTime) / 365 days * order.interest;
        uint amountOfETH = 1 * 10 ** 18 * (order.amountOfSat * 100 / getPrice()) / 100;

        // send value and interest to lender
        balancesETH[order.borrower] = balancesETH[order.borrower].sub((amountOfETH.add(amountOfInterest)));
        balancesETH[order.lender] = balancesETH[order.lender].add((amountOfETH.add(amountOfInterest)));

        order.status = Status.closed;

        emit BTCTBurned(_orderId, order.borrower, _sS, order.amountOfSat);
    }

    /**
     * @dev A Keeper liquidates the order because of the contract's time limit
     * @param _orderId BTCT loan orderId
     * @return boolean
     */
    function liquidateByTime(uint _orderId) public returns (bool) {
        Order storage order = orders[_orderId];

        require(order.status == Status.minted);

        require(now >= order.period);

        liquidate(order, _orderId);

        return true;
    }

    /**
     * @dev A Keeper liquidates the order because of the minimum collateral
     * @param _orderId BTCT loan orderId
     * @return boolean
     */
    function liquidateByPrice(uint _orderId) public returns (bool) {
        Order storage order = orders[_orderId];

        require(order.status == Status.minted);

        uint limit = 1 * 10 ** 18 * (order.amountOfSat * 135 / getPrice()) / 100;

        require(order.amountOfWei < limit);

        liquidate(order, _orderId);

        return true;
    }

    /**
     * @dev A Keeper burns BTCT on behalf of a borrower
     * @param _amountOfSat BTCT amount (with 18 decimals)
     * @return void
     */
    function burnOnBehalf(uint _amountOfSat) public {
        require(balanceOfToken(btct, msg.sender) >= _amountOfSat);

        balancesToken[btct][msg.sender] = balancesToken[btct][msg.sender].sub(_amountOfSat);

        debtPool = debtPool.sub(_amountOfSat);

        btct.burn(_amountOfSat);

        uint amount = 1 * 10 ** 18 * (_amountOfSat * 103 / getPrice()) / 100;

        msg.sender.transfer(amount);

        emit BurnedOnBehalf(msg.sender, amount, _amountOfSat, debtPool);
    }

    /**
     * @dev Borrower unlocks BTC in HTLC (HTLC refunds the BTC Lender)
     * @param _orderId BTCT loan orderId
     * @param _sR secret with which the borrower will unlock the BTC of HTLC
     * @return void
     */
    function purge(uint _orderId, bytes _sR) public {
        Order storage order = orders[_orderId];

        require(order.status == Status.liquidated);

        require(sha256(_sR) == order.rHash);

        balancesETH[order.borrower] = balancesETH[order.borrower].add(lockedRefundBalancesETH[_orderId]);

        lockedRefundBalancesETH[_orderId] = 0;

        order.status = Status.closed;
    }

    /**
     * @dev
     * @return uint
     */
    function getPrice() public view returns (uint) {
        // 34197279102384291
        return oracle.getPrice();
    }

    /**
     * @dev
     * @param _provider _provider
     * @return uint
     */
    function getDebts(address _provider) public view returns (uint) {
        return debts[_provider];
    }

    /**
     * @dev
     * @param _user _user
     * @return uint
     */
    function getLockedBalanceETH(address _user) public view returns (uint) {
        return lockedBalancesETH[_user];
    }

    /**
     * @dev
     * @param _user _user
     * @return uint
     */
    function getLockedBalanceSGB(address _user) public view returns (uint) {
        return lockedBalancesSGB[_user];
    }

    /**
     * @dev
     * @param _user _user
     * @return uint
     */
    function getLockedBalanceBTCT(address _user) public view returns (uint) {
        return lockedBalancesBTCT[_user];
    }

    /**
     * @dev returns the address of the token contract of BTCT
     * @return address
     */
    function getBtctAddress() public view returns (address) {
        return address(btct);
    }

    /**
     * @dev returns the address of the token contract of SGB
     * @return address
     */
    function getSgbAddress() public view returns (address) {
        return address(sgb);
    }

    /**
     * @dev
     * @param _orderId BTCT loan orderId
     * @return uint
     */
    function getMaintenance(uint _orderId) public view returns (uint) {
        Order storage order = orders[_orderId];

        uint limit = 1 * 10 ** 18 * (order.amountOfSat * 100 / getPrice()) / 100;

        return (order.amountOfWei * 1 * 10 ** 20) / limit;
    }

    /**
     * @dev
     * @param _order _order
     * @param _orderId BTCT loan orderId
     * @return boolean
     */
    function liquidate(Order _order, uint _orderId) internal returns (bool) {
        unlockCollateralDeposit(_order.borrower, _order.amountOfWei);

        unlockSecurityDeposit(_order.borrower, borrowerSecurityDepositSGB * multiplexer);

        balancesETH[_order.borrower] = balancesETH[_order.borrower].sub(_order.amountOfWei);

        uint amountOfRefundLock = 1 * 10 ** 18 * (_order.amountOfSat * 25 / getPrice()) / 100;

        lockedRefundBalancesETH[_orderId] = lockedRefundBalancesETH[_orderId].add(amountOfRefundLock);

        debtPool = debtPool.add(_order.amountOfSat);

        _order.status = Status.liquidated;

        emit Liquidated(_orderId, _order.borrower, now, _order.amountOfWei);
    }

    /**
     * @dev
     * @param _user _user
     * @param _amount _amount
     * @return void
     */
    function lockSecurityDeposit(address _user, uint _amount) internal {
        require(balanceOfToken(sgb, _user) >= _amount);

        balancesToken[sgb][_user] = balancesToken[sgb][_user].sub(_amount);

        lockedBalancesSGB[_user] = lockedBalancesSGB[_user].add(_amount);
    }

    /**
     * @dev
     * @param _user _user
     * @param _amount _amount
     * @return void
     */
    function unlockSecurityDeposit(address _user, uint _amount) internal {
        require(lockedBalancesSGB[_user] >= _amount);

        balancesToken[sgb][_user] = balancesToken[sgb][_user].add(_amount);

        lockedBalancesSGB[_user] = lockedBalancesSGB[_user].sub(_amount);
    }

    /**
     * @dev
     * @param _user _user
     * @param _amount _amount
     * @return void
     */
    function lockCollateralDeposit(address _user, uint _amount) internal {
        require(balanceOfETH(_user) >= _amount);

        balancesETH[_user] = balancesETH[_user].sub(_amount);

        lockedBalancesETH[_user] = lockedBalancesETH[_user].add(_amount);
    }

    /**
     * @dev
     * @param _user _user
     * @param _amount _amount
     * @return void
     */
    function unlockCollateralDeposit(address _user, uint _amount) internal {
        require(lockedBalancesETH[_user] >= _amount);

        balancesETH[_user] = balancesETH[_user].add(_amount);

        lockedBalancesETH[_user] = lockedBalancesETH[_user].sub(_amount);
    }
}
