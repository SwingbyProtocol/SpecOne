pragma solidity 0.5.0;

import "./FundManager.sol";
import "./SafeMath.sol";


contract WitnessEngine is FundManager {
    using SafeMath for uint256;

    mapping(address => bool) public witnesses;
    mapping(address => mapping(address => uint256)) private lockedBalancesSGB;
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

    /**
     * @dev
     * @param _token _token
     * @return void
     */
    function setToken(address _token) public {
        require(address(token) == address(0x0));
        token = Token(_token);
    }

    /**
     * @dev
     * @param _mode _mode
     * @param _user _user
     * @return void
     */
    function submitVote(uint _mode, address _user) public onlyWitness() {

        uint256 requireBalance = 40000 * 10 ** 18;

        require(balancesToken[address(token)][_user] >= requireBalance);

        balancesToken[address(token)][_user] = balancesToken[address(token)][_user].sub(requireBalance);
        lockedBalancesSGB[address(token)][_user] = lockedBalancesSGB[address(token)][_user].add(requireBalance);

        Vote memory vote = Vote({
            mode: _mode,   // 0 => add, 1 => remove
            count: 0,
            user: _user,
            startTime: block.timestamp
        });

        votes.push(vote);
    }

    /**
     * @dev
     * @param _voteId _voteId
     * @return void
     */
    function vote(uint _voteId) public onlyWitness() {

        Vote storage v = votes[_voteId];

        require(v.startTime <= block.timestamp - 3 hours);

        v.count = v.count.add(1);
    }

    /**
     * @dev
     * @param _voteId _voteId
     * @return void
     */
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

    /**
     * @dev
     * @param _user _user
     * @return boolean
     */
    function isWitness(address _user) public view returns (bool) {
        return witnesses[_user];
    }

    /**
     * @dev
     * @param _user _user
     * @return void
     */
    function add(address _user) internal {
        witnesses[_user] = true;
    }

    /**
     * @dev
     * @param _user _user
     * @return vooid
     */
    function remove(address _user) internal {
        uint amount = lockedBalancesSGB[address(token)][_user];
        balancesToken[address(token)][_user] = balancesToken[address(token)][_user].add(amount);
        witnesses[_user] = false;
    }

    /**
     * @dev
     * @param _user _user
     * @return vooid
     */
    function reset(address _user) internal {
        uint amount = lockedBalancesSGB[address(token)][_user];
        balancesToken[address(token)][_user] = balancesToken[address(token)][_user].add(amount);
    }
}
