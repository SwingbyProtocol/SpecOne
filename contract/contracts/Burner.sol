pragma solidity 0.4.24;

import "./ScriptVerification.sol";
import "./FundManager.sol";
import "./WitnessEngine.sol";
import "./GeneratorInterface.sol";
import "./TrustedOracleInterface.sol";


contract Burner is FundManager {

    mapping (address => uint256) private lockedBalances;
    mapping (uint => bool) private isUsed;
    mapping (address => uint) private debts;

    struct Request {
        uint    aOfSat;
        bytes   pubkey;
        uint    lockingAmount;
        bytes20 rsHash;
        bytes32 secretHash;
        bytes32 txId;
        address submitter;
        address provider;
        bool    isMinter;
        uint    verifiedTime;
        bool    isOpen;
    }

    Request[] private requests;

    ScriptVerification private sv;

    WitnessEngine private we;

    ERC20 private btct;

    GeneratorInterface private gen;

    TrustedOracleInterface private oracle;

    event RequestSubmitted(uint _reqId, address _user, uint _mLockAmount, uint _aOfWei, uint _aOfSat, bytes _pubkey);
    event ConfirmedByProvider(uint _reqId, uint _aOfSat, bytes20 _rsHash, bytes32 _sHash, bytes32 _txId, bytes _rs);
    event ConfirmedByWitness(uint _reqId, address _witness, uint _verifiedTime);
    event Attached(uint _reqId, uint _orderId);
    event Executed(uint _reqId, address _provider, bytes _secret, uint _aOfSat);

    constructor(address _sv, address _we, address _gen, address _oracle) public { 
        sv = ScriptVerification(_sv);
        we = WitnessEngine(_we);
        gen = GeneratorInterface(_gen);
        btct = ERC20(gen.getBTCT());
        oracle = TrustedOracleInterface(_oracle);
    }

    function submitRequest(uint _aOfSat, uint _aOfWei, bool _isMinter, bytes _pubkey) public {

        uint256 minLockAmount;

        if (_isMinter) {
            minLockAmount = 1 * 10 ** 18 * (_aOfSat * 140 / getPrice()) / 100;
            
        } else {
            minLockAmount = 1 * 10 ** 18 * (_aOfSat * 10 / getPrice()) / 100;
        }

        require(balanceOf(msg.sender) >= minLockAmount);

        require(_aOfWei >= minLockAmount);

        lockSecurityDeposit(msg.sender, _aOfWei);

        Request memory req = Request({
            aOfSat: _aOfSat,
            pubkey: _pubkey,
            lockingAmount: _aOfWei,
            rsHash: 0x0,
            secretHash: 0x0,
            txId: 0x0,
            submitter: msg.sender,
            provider: 0x0,
            isMinter: _isMinter,
            verifiedTime: 0,
            isOpen: true
        });
        requests.push(req);

        emit RequestSubmitted(requests.length - 1, msg.sender, minLockAmount, _aOfWei, _aOfSat, _pubkey);
    }

    function confirmByProvider(uint _reqId, bytes32 _txId, bytes _rs) public {

        Request storage req = requests[_reqId];

        bytes20 rsHash;
        bytes32 secretHash;

        require(req.secretHash == 0x0);

        (rsHash, secretHash) = sv.redeemScriptToSecretHash(_rs);

        req.rsHash = rsHash;
        req.secretHash = secretHash;
        req.txId = _txId;
        req.provider = msg.sender;

        emit ConfirmedByProvider(_reqId, req.aOfSat, rsHash, secretHash, _txId, _rs);

    }

    /**
     *  bytes _rawTx, 
        bytes32 _txId, 
        bytes20 _beneficially, 
        uint _amount, 
        uint _fee
     */
    function confirmByWitness(uint _reqId, bytes _rawTx) public {

        Request storage req = requests[_reqId];

        require(req.provider != 0x0);

        require(req.verifiedTime == 0);

        require(we.isWitness(msg.sender));

        require(sv.verifyTx(_rawTx, req.txId, req.rsHash, req.aOfSat, 0));

        req.verifiedTime = block.timestamp;

        emit ConfirmedByWitness(_reqId, msg.sender, req.verifiedTime);
    }

    function attach(uint _reqId, uint _orderId) public {

        Request storage req = requests[_reqId];

        address provider;
        uint aOfDebt;

        require(!isUsed[_orderId]);
        
        (aOfDebt, provider) = gen.getDeptByOrder(_orderId);
        
        require(aOfDebt == req.aOfSat);

        if (provider == req.provider && req.isMinter) {
            debts[provider] += aOfDebt;
            gen.confirmByBurner(_orderId);
            isUsed[_orderId] = true;
            emit Attached(_reqId, _orderId);
        }
        
    }

    function execute(uint _reqId, bytes _secret) public {

        Request storage req = requests[_reqId]; 

        require(req.verifiedTime != 0);

        require(req.secretHash == sha256(_secret));

        require(balanceOfToken(btct, req.submitter) >= req.aOfSat);

        burnBTCT(req.submitter, req.aOfSat);

        if (debts[req.provider] >= req.aOfSat) {
            debts[req.provider] -= req.aOfSat;
        } else if (debts[req.provider] < req.aOfSat) {
            debts[req.provider] = 0;
        }
        unlockSecurityDeposit(req.submitter, req.lockingAmount);

        emit Executed(_reqId, req.provider, _secret, req.aOfSat);
    }

    function liquidateByTime(uint _reqId) public returns (bool) {

        Request storage req = requests[_reqId];

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

        uint limit = 1 * 10 ** 18 * (req.aOfSat * 120 / getPrice()) / 100;

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

    function burnBTCT(address _user, uint _amountOfSat) internal {

        require(balanceOfToken(btct, _user) >= _amountOfSat);
        
        tokenBalances[btct][_user] -= _amountOfSat;   

        btct.transfer(gen, _amountOfSat);

        gen.burnBTCT(_amountOfSat);
    }

    function lockSecurityDeposit(address _user, uint _amount) internal {

        require(balanceOf(_user) >= _amount);

        ethBalances[_user] -= _amount;

        lockedBalances[_user] += _amount;

    }

    function unlockSecurityDeposit(address _user, uint _amount) internal {
        
        require(lockedBalances[_user] >= _amount);

        ethBalances[_user] += _amount;

        lockedBalances[_user] -= _amount;
    }
}
