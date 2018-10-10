pragma solidity 0.4.24;

import "./FundManager.sol";


contract WitnessEngine is FundManager {

    mapping(address => bool) public witnesses;
    mapping(address => mapping(address => uint256)) private tokenLockedBalances;
    uint public witnessCount;

    struct Vote {
        uint    mode;
        uint    count;
        address user;
        uint    startTime;
    }

    Vote[] private votes;

    Token public token;

    modifier onlyWitness() {
        require(witnesses[msg.sender]);
        _;
    }

    event UpdatedWitness(address _user);
    event RemovedWitness(address _user);

    constructor() public { 
        witnesses[msg.sender] = true;
        witnessCount = 1;
    }

    function setToken(address _token) public {
        require(address(token) == 0x0);
        token = Token(_token);
    }

    function submitVote(uint _mode, address _user) public onlyWitness() {
        
        uint256 requireBalance = 40000 * 10 ** 18;

        require(tokenBalances[token][_user] >= requireBalance);

        tokenBalances[token][_user] -= requireBalance;
        tokenLockedBalances[token][_user] += requireBalance;

        Vote memory vote = Vote({
            mode: _mode,   // 0 => add, 1 => remove
            count: 0,
            user: _user,
            startTime: block.timestamp
        });

        votes.push(vote);
    }
    
    function vote(uint _voteId) public onlyWitness() {
       
        Vote storage v = votes[_voteId];

        require(v.startTime <= block.timestamp - 3 hours);

        v.count += 1;
    }

    function exec(uint _voteId) public {
        Vote storage v = votes[_voteId];

        require(block.timestamp >= v.startTime + 3 hours);

        if (v.count * 1000 >= witnessCount * 1000 / 3000) {
            if (v.mode == 0) {
                add(v.user);
            } else if (v.mode == 1) {
                remove(v.user);
            }
        } else {
            reset(v.user);
        }
    }

    function isWitness(address _user) public view returns (bool) {
        return witnesses[_user];
    }

    function add(address _user) internal {
        witnesses[_user] = true;
    }

    function remove(address _user) internal {
        uint amount = tokenLockedBalances[token][_user];
        tokenBalances[token][_user] += amount;
        witnesses[_user] = false;
    }

    function reset(address _user) internal {
        uint amount = tokenLockedBalances[token][_user];
        tokenBalances[token][_user] += amount;
    }
}

