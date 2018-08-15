pragma solidity 0.4.24;

import "./ScriptVerification.sol";
import "./FundManager.sol";
import "./WitnessEngine.sol";


contract Burner is FundManager {

    mapping (address => uint256) private lockedBalances;
    mapping (bytes32 => bool) private isUsed;
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

    Req[] reqs;

    ScriptVerification private sv;

    WitnessEngine private we;

    EIP20Interface private btct;

    EIP20Interface private weth;

    event Submitted(bytes32 _reqHash, bytes _redeemScript);
    event ConfirmedByProcessor(bytes32 _reqHash, bytes32 _txId);

    constructor(address _sv, address _we, address _btct, address _weth) public { 
        sv = ScriptVerification(_sv);
        we = WitnessEngine(_we);
        btct = EIP20Interface(_btct);
    }

    function submitReq(uint _aOfSat, uint _aOfWei, bool _isMinter, bytes _pubkey) public {

        uint256 wethAmount;

        if (_isMinter) {
            wethAmount = _aOfSat * 130 * getPrice();
            
        } else {
            wethAmount = _aOfSat * 13 * getPrice();
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

        require(we.isWitness(msg.sender));

        require(sv.verifyTx(_rawTx, req.txId, req.rsHash, req.aOfSat, 0));

        req.verifiedTime = block.timestamp;
    }

    function attach(uint _reqId, uint _orderId) {

        Req storage req = reqs[_reqId];

        address minter;
        uint aOfDebt;
        
        (aOfDebt, minter) = gen.getDeptByOrder(_orderId);

        if (minter == req.provider && req.isMinter) {
            debts[minter] += aOfDebt;
        }
    }

    function execute(uint _reqId, bytes _secret) public {

        Req storage req = reqs[_reqId]; 

        require(req.secretHash == sha256(_secret));

        burnBTCT(req.submitter, req.aOfSat);

        unlockSecurityDeposit(req.submitter, req.lockingAmount);
    }

    function liquidate(uint _reqId) public {

        Req storage req = reqs[_reqId];

        require(req.isMinter);

        if (req.verifiedTime >= block.timestamp + 2 weeks) {
            req.isOpen = false;
            // liquidate
        }
    }

    function getPrice() public pure returns (uint) {
        return 22222;
    }

    function burnBTCT(address _user, uint _amountOfSat) internal {

        require(balanceOfToken(btct, _user) >= _amountOfSat);
        
        tokenBalances[btct][_user] -= _amountOfSat;   

        //btct.burn(_amountOfSat);
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
