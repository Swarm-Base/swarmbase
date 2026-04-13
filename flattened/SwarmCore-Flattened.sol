

// Sources flattened with hardhat v2.28.6 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.4) (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v4.9.6

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File contracts/SwarmCore.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SwarmCore v4 — Pre-TGE Engagement Layer
 *
 * @notice Records on-chain engagement signals for the SwarmBase community.
 *
 * HOW REWARDS WORK:
 *   Points (SwarmScore) are engagement signals — not tokens, not promises.
 *   At TGE and over a 2-year reward period, $SWARM distribution is determined
 *   by internal analysis of BOTH your total score AND HOW you collected it:
 *     - Diversity of engagement actions
 *     - Consistency over time (streak quality)
 *     - Quality of referrals (did they stay active?)
 *     - Early participation weighting
 *     - Anti-gaming filters applied off-chain
 *
 *   There is NO fixed point-to-token conversion rate.
 *   There is NO supply cap on points — scores grow indefinitely.
 *   The SwarmScore is a signal, not an entitlement.
 *
 * REWARD TIMELINE:
 *   Phase 1 (TGE):         Initial $SWARM airdrop via MerkleAirdrop contract
 *   Phase 2 (Year 1-2):    Ongoing rewards distributed periodically via
 *                           new Merkle snapshots — long-term engagement rewarded
 *
 * @dev No token address is referenced in this contract.
 *      Airdrop delivery is handled by a separate MerkleAirdrop contract at TGE.
 */
contract SwarmCore is Ownable {

    // ─── STATE ─────────────────────────────────────────────────────────────

    bool public paused;

    // Engagement score — a signal, not a currency
    mapping(address => uint256) public swarmScore;
    mapping(address => uint256) public registrationTime;
    mapping(address => uint256) public lastHiveCheckIn;
    mapping(address => uint256) public hiveStreak;
    mapping(address => uint256) public totalCheckIns;
    mapping(address => bool)    public registered;
    // Referral system — open one-step referral with tiered diminishing bonuses
    mapping(address => address) public invitedBy;
    mapping(address => uint256) public referralCount;  // successful referrals made
    // Referral quality milestones: 0=none 1=3ci(+100) 2=7ci(+50) 3=30ci(+200) 4=90ci(+500)
    mapping(address => uint8)   public referralMilestone;

    // Analytics
    uint256 public totalScoreIssued;
    uint256 public totalRegistered;

    // ─── EVENTS ────────────────────────────────────────────────────────────

    event UserRegistered(address indexed user, uint256 timestamp);
    event HiveCheckIn(address indexed user, uint256 streak, uint256 score, uint256 timestamp);
    event ReferralCompleted(address indexed referrer, address indexed referee, uint256 score, uint256 timestamp);
    event ReferralMilestoneAwarded(address indexed referrer, address indexed referee, uint256 checkIns, uint256 bonus, uint256 timestamp);
    event StreakMilestone(address indexed user, uint256 checkInCount, uint256 bonus, uint256 timestamp);
    event Paused(uint256 timestamp);
    event Unpaused(uint256 timestamp);

    // ─── MODIFIERS ─────────────────────────────────────────────────────────

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ─── CONSTRUCTOR ───────────────────────────────────────────────────────

    constructor() Ownable() {}

    // ─── REGISTRATION ──────────────────────────────────────────────────────

    /**
     * @notice Register directly (no referral)
     */
    function register() external whenNotPaused {
        require(!registered[msg.sender], "Already registered");
        registered[msg.sender] = true;
        registrationTime[msg.sender] = block.timestamp;
        totalRegistered++;
        _recordScore(msg.sender, 50e18); // 50-pt welcome bonus
        emit UserRegistered(msg.sender, block.timestamp);
    }

    /**
     * @notice Register with a referral link.
     * @param referrer Address of the referrer (must be registered)
     * @dev Open referral — no prior invitation required.
     *      Share link format: point.swarmbase.io/?ref=0xADDRESS
     *
     *      Referral quality scoring (anti-sybil, rewards long-term engagement):
     *        On registration          : referrer earns +10 pts immediately
     *        Referee's  3rd check-in  : referrer earns +100 pts
     *        Referee's  7th check-in  : referrer earns  +50 pts
     *        Referee's 30th check-in  : referrer earns +200 pts
     *        Referee's 90th check-in  : referrer earns +500 pts  (max 860 pts total per referral)
     *
     *      Milestones require consecutive 24-hour check-ins — sybil farming costs
     *      real calendar time, not just gas.
     */
    function registerWithReferral(address referrer) external whenNotPaused {
        require(!registered[msg.sender], "Already registered");
        require(referrer != address(0),  "Invalid referrer");
        require(referrer != msg.sender,  "Cannot refer self");
        require(registered[referrer],    "Referrer not registered");

        registered[msg.sender]       = true;
        invitedBy[msg.sender]        = referrer;
        registrationTime[msg.sender] = block.timestamp;
        totalRegistered++;

        referralCount[referrer]++;

        // Phase 1: immediate rewards
        _recordScore(msg.sender, 50e18);  // 50-pt welcome bonus for new registrant
        uint256 immediateBonus = 10e18;   // 10-pt signal bonus for referrer
        _recordScore(referrer, immediateBonus);

        emit UserRegistered(msg.sender, block.timestamp);
        emit ReferralCompleted(referrer, msg.sender, immediateBonus, block.timestamp);
    }

    // ─── ENGAGEMENT ACTIONS ────────────────────────────────────────────────

    /**
     * @notice Daily check-in — builds streak multiplier and milestone bonuses.
     * @dev Streak levels 1–30 (capped). Multiplier: 1.0x (day 1) → ~3.0x (day 30+).
     *      Miss 2 consecutive days (>48h since last check-in): streak resets to 0.
     *
     *      Base: 25 pts/day. Peak: ~76 pts/day at streak 30.
     *
     *      Recurring milestone bonuses (based on lifetime totalCheckIns):
     *        Every  7 check-ins : +150 pts
     *        Every 30 check-ins : +500 pts
     *        Every 90 check-ins : +1,500 pts (takes priority over 30-day on same tick)
     */
    function hiveCheckIn() external whenNotPaused {
        require(registered[msg.sender], "Not registered");
        require(
            block.timestamp >= lastHiveCheckIn[msg.sender] + 86400,
            "Already checked in today"
        );

        uint256 streak = hiveStreak[msg.sender];

        // Reset if missed >48h
        if (
            lastHiveCheckIn[msg.sender] > 0 &&
            block.timestamp > lastHiveCheckIn[msg.sender] + 172800
        ) {
            streak = 0;
        }

        streak++;
        if (streak > 30) streak = 30;

        totalCheckIns[msg.sender]++;
        hiveStreak[msg.sender]    = streak;
        lastHiveCheckIn[msg.sender] = block.timestamp;

        // Score: 25 base × streak multiplier (1.0x at streak=1, ~3.0x at streak=30)
        // mult range: 100 (streak=1) → 303 (streak=30). Streak is capped at 30 above.
        // Day 1 = 25 pts, Day 30 ≈ 76 pts.
        uint256 mult = 100 + (streak - 1) * 7;
        uint256 score = (25e18 * mult) / 100;

        _recordScore(msg.sender, score);
        emit HiveCheckIn(msg.sender, streak, score, block.timestamp);

        // Recurring streak milestones (lifetime check-ins, highest tier takes priority)
        uint256 ci = totalCheckIns[msg.sender];
        if (ci % 90 == 0) {
            // Every 90 check-ins: +1,500 pts
            _recordScore(msg.sender, 1500e18);
            emit StreakMilestone(msg.sender, ci, 1500e18, block.timestamp);
        } else if (ci % 30 == 0) {
            // Every 30 check-ins: +500 pts
            _recordScore(msg.sender, 500e18);
            emit StreakMilestone(msg.sender, ci, 500e18, block.timestamp);
        } else if (ci % 7 == 0) {
            // Every 7 check-ins: +150 pts
            _recordScore(msg.sender, 150e18);
            emit StreakMilestone(msg.sender, ci, 150e18, block.timestamp);
        }

        // Referral quality milestones — rewards referrer as referee stays active
        address referrer = invitedBy[msg.sender];
        if (referrer != address(0)) {
            // ci already in scope from streak milestone block above
            uint8   milestone   = referralMilestone[msg.sender];
            uint256 mBonus;
            uint8   nextMilestone;

            if      (ci == 3  && milestone == 0) { mBonus = 100e18; nextMilestone = 1; }
            else if (ci == 7  && milestone == 1) { mBonus =  50e18; nextMilestone = 2; }
            else if (ci == 30 && milestone == 2) { mBonus = 200e18; nextMilestone = 3; }
            else if (ci == 90 && milestone == 3) { mBonus = 500e18; nextMilestone = 4; }

            if (mBonus > 0) {
                referralMilestone[msg.sender] = nextMilestone;
                _recordScore(referrer, mBonus);
                emit ReferralMilestoneAwarded(referrer, msg.sender, ci, mBonus, block.timestamp);
            }
        }
    }

    // ─── INTERNAL ──────────────────────────────────────────────────────────

    /**
     * @notice Record engagement score — no cap, unbounded
     * @dev Score is a signal only. No token entitlement is created here.
     */
    function _recordScore(address user, uint256 score) internal {
        swarmScore[user]  += score;
        totalScoreIssued  += score;
    }

    // ─── OWNER ─────────────────────────────────────────────────────────────

    /**
     * @dev Disabled — renouncing ownership would permanently prevent unpausing.
     */
    function renounceOwnership() public view override onlyOwner {
        revert("SwarmCore: renounce disabled");
    }

    function pause() external onlyOwner {
        require(!paused, "Already paused");
        paused = true;
        emit Paused(block.timestamp);
    }

    function unpause() external onlyOwner {
        require(paused, "Not paused");
        paused = false;
        emit Unpaused(block.timestamp);
    }

    // ─── VIEWS ─────────────────────────────────────────────────────────────
    // All state is directly readable via public mappings/variables:
    //   swarmScore(addr)         — engagement score
    //   registered(addr)         — registration status
    //   registrationTime(addr)   — unix timestamp of registration
    //   hiveStreak(addr)         — current streak level (1–30)
    //   totalCheckIns(addr)      — lifetime check-in count
    //   lastHiveCheckIn(addr)    — timestamp of last check-in
    //   referralCount(addr)      — successful referrals made
    //   invitedBy(addr)          — referrer address (if any)
    //   totalRegistered          — global registration count
    //   totalScoreIssued         — global score total
}
