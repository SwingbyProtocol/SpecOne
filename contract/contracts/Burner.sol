pragma solidity 0.4.24;

import "./ScriptVerification.sol";
import "./FundManager.sol";
import "./WitnessEngine.sol";
import "./GeneratorInterface.sol";


contract Burner is FundManager {

    mapping (address => uint256) private lockedBalances;
    mapping (uint => bool) private isUsed;
    mapping (address => uint) private debts;

    struct Req {
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

    Req[] private reqs;

    ScriptVerification private sv;

    WitnessEngine private we;

    ERC20 private btct;

    GeneratorInterface private gen;

    event SubmittedReq(uint _orderId, uint _wethAmount, uint _aOfWei, bool _isMinter, bytes _pubkey);
    event ConfirmedByProcessor(bytes32 _reqHash, bytes32 _txId);
    event OrderSubmitted(uint _orderId, uint _aOfSat, bytes _pubkey);

    constructor(address _sv, address _we, address _gen) public { 
        sv = ScriptVerification(_sv);
        we = WitnessEngine(_we);
        gen = GeneratorInterface(_gen);
        btct = ERC20(gen.getBTCT());
    }

    function submitReq(uint _aOfSat, uint _aOfWei, bool _isMinter, bytes _pubkey) public {

        uint256 wethAmount;

        if (_isMinter) {
            wethAmount = 1 * 10 ** 18 * (_aOfSat * 140 / getPrice()) / 100;
            
        } else {
            wethAmount = 1 * 10 ** 18 * (_aOfSat * 10 / getPrice()) / 100;
        }

        require(balanceOf(msg.sender) >= wethAmount);

        require(_aOfWei >= wethAmount);

        lockSecurityDeposit(msg.sender, _aOfWei);

        Req memory req = Req({
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
        reqs.push(req);

        emit SubmittedReq(reqs.length - 1, wethAmount, _aOfWei, _isMinter, _pubkey);
    }

    function confirmByProvider(uint _reqId, bytes32 _txId, bytes _rs) public {

        Req storage req = reqs[_reqId];

        bytes20 rsHash;
        bytes32 secretHash;

        (rsHash, secretHash) = sv.redeemScriptToSecretHash(_rs);

        req.rsHash = rsHash;
        req.secretHash = secretHash;
        req.txId = _txId;
        req.provider = msg.sender;

        emit ConfirmedByProcessor(secretHash, _txId);

    }

    /**
     *  bytes _rawTx, 
        bytes32 _txId, 
        bytes20 _beneficially, 
        uint _amount, 
        uint _fee
     */
    function confirmByWitness(uint _reqId, bytes _rawTx) public {

        Req storage req = reqs[_reqId];

        require(req.provider != 0x0);

        require(req.verifiedTime == 0);

        require(we.isWitness(msg.sender));

        require(sv.verifyTx(_rawTx, req.txId, req.rsHash, req.aOfSat, 0));

        req.verifiedTime = block.timestamp;
    }

    function attach(uint _reqId, uint _orderId) public {

        Req storage req = reqs[_reqId];

        address minter;
        uint aOfDebt;

        require(!isUsed[_orderId]);
        
        (aOfDebt, minter) = gen.getDeptByOrder(_orderId);

        if (minter == req.provider && req.isMinter) {
            debts[minter] += aOfDebt;
            gen.confirmByBurner(_orderId);
            isUsed[_orderId] = true;
        }
    }

    function execute(uint _reqId, bytes _secret) public {

        Req storage req = reqs[_reqId]; 

        require(req.secretHash == sha256(_secret));

        burnBTCT(req.submitter, req.aOfSat);

        if (debts[req.provider] >= req.aOfSat) {
            debts[req.provider] -= req.aOfSat;
        } else if (debts[req.provider] < req.aOfSat) {
            debts[req.provider] = 0;
        }

        unlockSecurityDeposit(req.submitter, req.lockingAmount);
    }

    function liquidateByTime(uint _reqId) public returns (bool) {

        Req storage req = reqs[_reqId];

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

        Req storage req = reqs[_reqId];

        uint limit = 1 * 10 ** 18 * (req.aOfSat * 120 / getPrice()) / 100;

        if (limit > req.lockingAmount) {
            lockedBalances[req.submitter] = 0;
            req.isOpen = false;
            return true;
        }
        return true;
    }

    function getPrice() public pure returns (uint) {
        return 47860091570967499;
    }

    function burnBTCT(address _user, uint _amountOfSat) internal {

        require(balanceOfToken(btct, _user) >= _amountOfSat);
        
        tokenBalances[btct][_user] -= _amountOfSat;   

        btct.transfer(gen, _amountOfSat);
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
