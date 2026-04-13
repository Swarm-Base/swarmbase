// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SwarmNFT v4 — Tiered Soulbound Badges
 * @notice Three-tier soulbound badge system for SwarmBase participants.
 *
 * TIERS:
 *   Pioneer  (ID 1) — Unlimited supply. Gate: registered on SwarmCore.
 *   Builder  (ID 2) — Unlimited supply. Gate: swarmScore >= 1,000.
 *   OG       (ID 3) — 5,000 max.       Gate: swarmScore >= 5,000 + registered >= 14 days.
 *
 * All badges are soulbound — non-transferable after mint.
 * Gates are enforced entirely on-chain via SwarmCore reads.
 * No backend signatures required.
 *
 * @dev Reads swarmScore and registrationTime from SwarmCore.
 *      SwarmCore address is set at deployment and can be updated by owner
 *      until locked.
 */

/**
 * @dev Minimal interface for reading engagement data from SwarmCore.
 *
 * AUDITOR NOTE — External Dependency Safety:
 *   SwarmCore's pause() function only blocks STATE-WRITING functions
 *   (register, registerWithReferral, hiveCheckIn, agentSession, etc.).
 *   All view functions (swarmScore, registered, registrationTime) are
 *   READ-ONLY and remain accessible regardless of pause state.
 *
 *   This means SwarmBadge badge gates will ALWAYS be evaluable,
 *   even if SwarmCore is paused for an emergency.
 *
 *   The SwarmCore address is updateable by owner until lockSwarmCore()
 *   is called — after which it is permanently immutable.
 *   This allows correction of a misconfigured address before going live,
 *   but prevents silent substitution once the system is in production.
 */
interface ISwarmCore {
    function swarmScore(address user)        external view returns (uint256);
    function registered(address user)        external view returns (bool);
    function registrationTime(address user)  external view returns (uint256);
}

contract SwarmBadge is ERC1155, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // ─── BADGE IDs ─────────────────────────────────────────────────────────

    uint256 public constant PIONEER = 1;
    uint256 public constant BUILDER = 2;
    uint256 public constant OG      = 3;

    // ─── GATES ─────────────────────────────────────────────────────────────

    uint256 public constant BUILDER_SCORE_GATE = 1_000e18;  // 1,000 score
    uint256 public constant OG_SCORE_GATE      = 5_000e18;  // 5,000 score
    uint256 public constant OG_TIME_GATE       = 14 days;   // registered >= 14 days
    uint256 public constant OG_MAX_SUPPLY      = 5_000;

    // ─── STATE ─────────────────────────────────────────────────────────────

    ISwarmCore public swarmCore;
    bool public swarmCoreLocked;

    mapping(uint256 => uint256) public totalMinted;
    mapping(address => mapping(uint256 => bool)) public hasMinted;

    bool   public mintingPaused;
    string public name   = "SwarmBase Badge";
    string public symbol = "SWARM-BADGE";
    // L-02: _baseURI removed — URI stored exclusively via OZ _setURI() / _uri

    // ─── EVENTS ────────────────────────────────────────────────────────────

    event BadgeMinted(address indexed to, uint256 indexed tokenId, uint256 totalMinted);
    event SwarmCoreSet(address indexed swarmCore);
    event SwarmCoreLocked();
    event MintingPausedChanged(bool paused);
    event BaseURIUpdated(string newURI);

    // ─── CONSTRUCTOR ───────────────────────────────────────────────────────

    /**
     * @param _swarmCore  Address of the SwarmCore contract
     * @param baseURI_    Base URI for badge metadata (e.g. ipfs://...)
     */
    constructor(address _swarmCore, string memory baseURI_)
        ERC1155(baseURI_)  // L-02: calls _setURI(baseURI_) internally — no duplicate storage
        Ownable()
        ReentrancyGuard()
    {
        require(_swarmCore != address(0), "Invalid SwarmCore address");
        swarmCore = ISwarmCore(_swarmCore);
    }

    // ─── SOULBOUND ─────────────────────────────────────────────────────────

    /**
     * @dev Block all transfers except minting (from == address(0)).
     *      Enforces soulbound behaviour — badges cannot be sold or transferred.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        require(from == address(0), "SwarmNFT: soulbound - non-transferable");
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev L-01: Block setApprovalForAll — approvals are meaningless on a soulbound token
     *      since transfers are already blocked. Disabling prevents misleading state.
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("SwarmBadge: soulbound, approvals disabled");
    }

    // ─── MINT MODIFIER ─────────────────────────────────────────────────────

    modifier mintable() {
        require(!mintingPaused, "SwarmNFT: minting paused");
        // L-03: prevent minting while SwarmCore address is still mutable
        require(swarmCoreLocked, "SwarmBadge: lock SwarmCore before minting");
        _;
    }

    // ─── MINTING ───────────────────────────────────────────────────────────

    /**
     * @notice Mint Pioneer badge.
     * @dev Gate: registered on SwarmCore.
     */
    function mintPioneer() external mintable nonReentrant {
        require(swarmCore.registered(msg.sender),      "SwarmNFT: not registered on SwarmCore");
        require(!hasMinted[msg.sender][PIONEER],       "SwarmNFT: Pioneer already minted");

        _doMint(msg.sender, PIONEER);
    }

    /**
     * @notice Mint Builder badge.
     * @dev Gate: swarmScore >= 1,000.
     */
    function mintBuilder() external mintable nonReentrant {
        require(swarmCore.registered(msg.sender),              "SwarmNFT: not registered on SwarmCore");
        require(!hasMinted[msg.sender][BUILDER],               "SwarmNFT: Builder already minted");
        require(
            swarmCore.swarmScore(msg.sender) >= BUILDER_SCORE_GATE,
            "SwarmNFT: score too low for Builder (need 1,000)"
        );

        _doMint(msg.sender, BUILDER);
    }

    /**
     * @notice Mint OG badge — limited to 5,000 supply.
     * @dev Gate: swarmScore >= 5,000 AND registered >= 14 days.
     */
    function mintOG() external mintable nonReentrant {
        require(swarmCore.registered(msg.sender),              "SwarmNFT: not registered on SwarmCore");
        require(!hasMinted[msg.sender][OG],                    "SwarmNFT: OG already minted");
        require(totalMinted[OG] < OG_MAX_SUPPLY,               "SwarmNFT: OG sold out");
        require(
            swarmCore.swarmScore(msg.sender) >= OG_SCORE_GATE,
            "SwarmNFT: score too low for OG (need 5,000)"
        );
        require(
            block.timestamp >= swarmCore.registrationTime(msg.sender) + OG_TIME_GATE,
            "SwarmNFT: must be registered for at least 14 days"
        );

        _doMint(msg.sender, OG);
    }

    // ─── INTERNAL ──────────────────────────────────────────────────────────

    function _doMint(address to, uint256 tokenId) internal {
        hasMinted[to][tokenId] = true;
        totalMinted[tokenId]++;
        _mint(to, tokenId, 1, "");
        emit BadgeMinted(to, tokenId, totalMinted[tokenId]);
    }

    // ─── VIEWS ─────────────────────────────────────────────────────────────

    /**
     * @notice Check if a wallet holds a specific badge
     */
    function hasBadge(address account, uint256 tokenId) external view returns (bool) {
        return balanceOf(account, tokenId) > 0;
    }

    /**
     * @notice Check eligibility for each badge (useful for UI)
     */
    function getEligibility(address account) external view returns (
        bool pioneerEligible,
        bool builderEligible,
        bool ogEligible,
        uint256 score,
        uint256 daysSinceRegistration,
        uint256 ogRemaining
    ) {
        bool reg    = swarmCore.registered(account);
        uint256 sc  = swarmCore.swarmScore(account);
        uint256 rt  = swarmCore.registrationTime(account);
        uint256 age = rt > 0 ? (block.timestamp - rt) / 1 days : 0;
        uint256 remaining = OG_MAX_SUPPLY - totalMinted[OG];

        // If minting is paused, no badge is currently mintable — return false for all three
        if (mintingPaused) {
            return (false, false, false, sc, age, remaining);
        }

        return (
            reg && !hasMinted[account][PIONEER],
            reg && sc >= BUILDER_SCORE_GATE && !hasMinted[account][BUILDER],
            reg && sc >= OG_SCORE_GATE && age >= 14 && totalMinted[OG] < OG_MAX_SUPPLY && !hasMinted[account][OG],
            sc,
            age,
            remaining
        );
    }

    /**
     * @notice Get URI for token metadata
     */
    // L-02: reads from OZ _uri via super.uri() — no separate _baseURI needed
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenId >= PIONEER && tokenId <= OG, "SwarmNFT: invalid token ID");
        return string(abi.encodePacked(super.uri(tokenId), tokenId.toString(), ".json"));
    }

    // ─── ADMIN ─────────────────────────────────────────────────────────────

    /**
     * @dev Disabled — renouncing ownership would permanently lock admin functions.
     */
    function renounceOwnership() public view override onlyOwner {
        revert("SwarmNFT: renounce disabled");
    }

    /**
     * @notice Update SwarmCore address (before locking)
     */
    function setSwarmCore(address _swarmCore) external onlyOwner {
        require(!swarmCoreLocked,         "SwarmNFT: SwarmCore address locked");
        require(_swarmCore != address(0), "Invalid address");
        swarmCore = ISwarmCore(_swarmCore);
        emit SwarmCoreSet(_swarmCore);
    }

    /**
     * @notice Lock SwarmCore address permanently
     */
    function lockSwarmCore() external onlyOwner {
        swarmCoreLocked = true;
        emit SwarmCoreLocked();
    }

    /**
     * @notice Set base URI for metadata
     * @dev L-02: uses _setURI() for storage and emits EIP-1155 URI event
     */
    function setBaseURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
        emit URI(newURI, 0);  // EIP-1155 standard URI event (id=0 signals base URI change)
        emit BaseURIUpdated(newURI);
    }

    /**
     * @notice Pause/unpause minting (emergency)
     */
    function setMintingPaused(bool paused) external onlyOwner {
        mintingPaused = paused;
        emit MintingPausedChanged(paused);
    }
}
