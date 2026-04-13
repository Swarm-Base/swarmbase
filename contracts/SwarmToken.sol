// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SwarmToken — $SWARM BEP-20 Token
 * @notice Production token for the SwarmBase protocol.
 * @dev BEP-20 compatible. 1B total supply. Deflationary (20% fee burn).
 * @dev Tokenomics: swarmbase.io/tokenomics
 * @dev Chain: BNB Smart Chain (BSC) — production TGE deployment.
 *      The current pre-TGE deployment on opBNB Mainnet is for testing and
 *      community engagement purposes only. The production $SWARM token will
 *      be deployed on BSC (ChainId 56) at TGE.
 *
 * Distribution:
 *   20% — Community (200M)       2% at TGE, 1mo cliff, 24mo vest
 *   15% — Team (150M)            0% at TGE, 12mo cliff, 24mo vest
 *   15% — Ecosystem (150M)       1.5% at TGE, 1mo cliff, 24mo vest
 *   12% — Marketing (120M)       1% at TGE, 1mo cliff, 12mo vest
 *   10% — Strategic Round (100M) 0% at TGE, 12mo cliff, 12mo vest
 *    8% — Treasury (80M)         1% at TGE, 12mo cliff, 12mo vest
 *    8% — Liquidity (80M)        8% at TGE (CEX + DEX)
 *    7% — Reserve (70M)          1% at TGE, remainder locked
 *    5% — Strategic Partners(50M) 0% at TGE, 12mo cliff, 12mo vest
 */
contract SwarmToken is ERC20, ERC20Burnable, Ownable {

    // ─── CONSTANTS ─────────────────────────────────────────────────────────

    uint256 public constant TOTAL_SUPPLY       = 1_000_000_000 * 1e18;

    // Distribution buckets (in tokens, not %)
    uint256 public constant COMMUNITY_SUPPLY        = 200_000_000 * 1e18; // 20%
    uint256 public constant TEAM_SUPPLY             = 150_000_000 * 1e18; // 15%
    uint256 public constant ECOSYSTEM_SUPPLY        = 150_000_000 * 1e18; // 15%
    uint256 public constant MARKETING_SUPPLY        = 120_000_000 * 1e18; // 12%
    uint256 public constant STRATEGIC_ROUND_SUPPLY  = 100_000_000 * 1e18; // 10%
    uint256 public constant TREASURY_SUPPLY         =  80_000_000 * 1e18; //  8%
    uint256 public constant LIQUIDITY_SUPPLY        =  80_000_000 * 1e18; //  8%
    uint256 public constant RESERVE_SUPPLY          =  70_000_000 * 1e18; //  7%
    uint256 public constant STRATEGIC_PARTNERS_SUPPLY = 50_000_000 * 1e18; //  5%

    /// @dev Informational constant only — no automatic fee deduction occurs.
    ///      Platform fee burns are executed manually via burnFees().
    ///      The 20% rate is enforced off-chain by the fee collection process.
    uint256 public constant BURN_FEE_BPS = 2000; // 20% in basis points

    // ─── STATE ─────────────────────────────────────────────────────────────

    // Wallet assignments — set by owner at TGE, adjustable before lock
    address public communityWallet;
    address public teamWallet;
    address public ecosystemWallet;
    address public marketingWallet;
    address public strategicRoundWallet;
    address public treasuryWallet;
    address public liquidityWallet;
    address public reserveWallet;
    address public strategicPartnersWallet;

    // SwarmCore contract address — set after deployment (no hardcoding)
    // This links the token to the engagement/points system
    address public swarmCoreContract;
    bool public swarmCoreLocked;

    // Total tokens burned via fee mechanism
    uint256 public totalBurned;

    // Distribution tracking
    bool public distributed;

    // ─── EVENTS ────────────────────────────────────────────────────────────

    event SwarmCoreLinkSet(address indexed swarmCore);
    event SwarmCoreLocked(address indexed swarmCore);
    event FeesBurned(uint256 amount, uint256 totalBurned);
    event WalletUpdated(string walletType, address oldWallet, address newWallet);
    event TokensDistributed(uint256 timestamp);

    // ─── CONSTRUCTOR ───────────────────────────────────────────────────────

    constructor(address _owner) ERC20("SwarmBase", "SWARM") Ownable() {
        // Mint full supply to owner for distribution
        _mint(_owner, TOTAL_SUPPLY);
        _transferOwnership(_owner);
    }

    // ─── SWARMCORE LINK ────────────────────────────────────────────────────

    /**
     * @notice Set SwarmCore contract address (adjustable until locked)
     * @param _swarmCore Address of the SwarmCoreV4 contract
     * @dev Call this after SwarmCore deployment — no need to redeploy token
     */
    function setSwarmCore(address _swarmCore) external onlyOwner {
        require(!swarmCoreLocked, "SwarmCore address is locked");
        require(_swarmCore != address(0), "Invalid address");
        swarmCoreContract = _swarmCore;
        emit SwarmCoreLinkSet(_swarmCore);
    }

    /**
     * @notice Lock SwarmCore address permanently (call after final deployment)
     */
    function lockSwarmCore() external onlyOwner {
        require(swarmCoreContract != address(0), "SwarmCore not set");
        swarmCoreLocked = true;
        emit SwarmCoreLocked(swarmCoreContract);
    }

    // ─── DISTRIBUTION ──────────────────────────────────────────────────────

    /**
     * @notice Set all distribution wallet addresses before distributing
     */
    function setWallets(
        address _community,
        address _team,
        address _ecosystem,
        address _marketing,
        address _strategicRound,
        address _treasury,
        address _liquidity,
        address _reserve,
        address _strategicPartners
    ) external onlyOwner {
        require(!distributed,              "Already distributed");
        require(_community         != address(0), "Invalid community wallet");
        require(_team              != address(0), "Invalid team wallet");
        require(_ecosystem         != address(0), "Invalid ecosystem wallet");
        require(_marketing         != address(0), "Invalid marketing wallet");
        require(_strategicRound    != address(0), "Invalid strategicRound wallet");
        require(_treasury          != address(0), "Invalid treasury wallet");
        require(_liquidity         != address(0), "Invalid liquidity wallet");
        require(_reserve           != address(0), "Invalid reserve wallet");
        require(_strategicPartners != address(0), "Invalid strategicPartners wallet");
        communityWallet         = _community;
        teamWallet              = _team;
        ecosystemWallet         = _ecosystem;
        marketingWallet         = _marketing;
        strategicRoundWallet    = _strategicRound;
        treasuryWallet          = _treasury;
        liquidityWallet         = _liquidity;
        reserveWallet           = _reserve;
        strategicPartnersWallet = _strategicPartners;
    }

    /**
     * @notice Distribute tokens to all wallets per tokenomics
     * @dev One-time call. Transfers from owner to all designated wallets.
     */
    function distribute() external onlyOwner {
        require(!distributed, "Already distributed");
        require(communityWallet         != address(0), "Community wallet not set");
        require(teamWallet              != address(0), "Team wallet not set");
        require(ecosystemWallet         != address(0), "Ecosystem wallet not set");
        require(marketingWallet         != address(0), "Marketing wallet not set");
        require(strategicRoundWallet    != address(0), "Strategic round wallet not set");
        require(treasuryWallet          != address(0), "Treasury wallet not set");
        require(liquidityWallet         != address(0), "Liquidity wallet not set");
        require(reserveWallet           != address(0), "Reserve wallet not set");
        require(strategicPartnersWallet != address(0), "Strategic partners wallet not set");

        distributed = true;

        // Use internal _transfer to avoid unchecked return value from ERC20.transfer()
        _transfer(msg.sender, communityWallet,           COMMUNITY_SUPPLY);
        _transfer(msg.sender, teamWallet,                TEAM_SUPPLY);
        _transfer(msg.sender, ecosystemWallet,           ECOSYSTEM_SUPPLY);
        _transfer(msg.sender, marketingWallet,           MARKETING_SUPPLY);
        _transfer(msg.sender, strategicRoundWallet,      STRATEGIC_ROUND_SUPPLY);
        _transfer(msg.sender, treasuryWallet,            TREASURY_SUPPLY);
        _transfer(msg.sender, liquidityWallet,           LIQUIDITY_SUPPLY);
        _transfer(msg.sender, reserveWallet,             RESERVE_SUPPLY);
        _transfer(msg.sender, strategicPartnersWallet,   STRATEGIC_PARTNERS_SUPPLY);

        emit TokensDistributed(block.timestamp);
    }

    // ─── FEE BURN MECHANISM ────────────────────────────────────────────────

    /**
     * @notice Burn tokens as protocol fee (20% of platform fees)
     * @dev Called by treasury or protocol fee collector
     * @param amount Amount to burn
     */
    function burnFees(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit FeesBurned(amount, totalBurned);
    }

    // ─── VIEW FUNCTIONS ────────────────────────────────────────────────────

    /**
     * @notice Get circulating supply.
     * @dev ERC20Burnable reduces totalSupply() on burn, so totalSupply() already
     *      reflects all burned tokens. No separate subtraction needed.
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @notice Get token info summary
     */
    function tokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint256 supply,
        uint256 burned,
        address swarmCore,
        bool coreLocked
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            totalBurned,
            swarmCoreContract,
            swarmCoreLocked
        );
    }

    // ─── ADMIN ─────────────────────────────────────────────────────────────

    /// @dev Reject accidental BNB/ETH sends — no native currency accepted
    receive() external payable {
        revert("SwarmToken: no native currency accepted");
    }

    /**
     * @notice Update a wallet address (before distribution only)
     */
    function updateWallet(string memory walletType, address newWallet) external onlyOwner {
        require(!distributed, "Already distributed");
        require(newWallet != address(0), "Invalid address");

        bytes32 typeHash = keccak256(abi.encodePacked(walletType));
        address old;

        if (typeHash == keccak256("community"))            { old = communityWallet; communityWallet = newWallet; }
        else if (typeHash == keccak256("team"))            { old = teamWallet; teamWallet = newWallet; }
        else if (typeHash == keccak256("ecosystem"))       { old = ecosystemWallet; ecosystemWallet = newWallet; }
        else if (typeHash == keccak256("marketing"))       { old = marketingWallet; marketingWallet = newWallet; }
        else if (typeHash == keccak256("strategicRound"))  { old = strategicRoundWallet; strategicRoundWallet = newWallet; }
        else if (typeHash == keccak256("treasury"))        { old = treasuryWallet; treasuryWallet = newWallet; }
        else if (typeHash == keccak256("liquidity"))       { old = liquidityWallet; liquidityWallet = newWallet; }
        else if (typeHash == keccak256("reserve"))         { old = reserveWallet; reserveWallet = newWallet; }
        else if (typeHash == keccak256("strategicPartners")) { old = strategicPartnersWallet; strategicPartnersWallet = newWallet; }
        else revert("Unknown wallet type");

        emit WalletUpdated(walletType, old, newWallet);
    }
}
