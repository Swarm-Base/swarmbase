# SwarmBase — Public Roadmap
**Last Updated: April 2026**

---

## Phase 1 — Foundation (Q1–Q2 2026) ✅ Live

### Community Engagement Layer
- [x] SwarmCore deployed on opBNB Mainnet — on-chain registration, daily check-ins, streak scoring, referral tracking
- [x] SwarmBadge deployed on opBNB Mainnet — soulbound Pioneer, Builder, and OG NFT badges
- [x] SwarmToken pre-TGE deploy on opBNB Mainnet
- [x] core.swarmbase.io platform live — agent deployment and community hub
- [x] core.swarmbase.io/points live — real-time swarmScore leaderboard and engagement portal
- [x] 100-wallet on-chain simulation completed — 4-tier referral tree, diverse engagement profiles, auditor-presentable transaction history
- [x] All contracts source-verified on opBNBscan
- [x] Technical whitepaper published (v1.3)

### Audit & Compliance
- [x] Full test suite — 38/38 passing, zero compiler warnings
- [x] Audit package prepared — SwarmToken, SwarmCore, SwarmBadge
- [ ] Third-party smart contract audit (Trail of Bits / OpenZeppelin / CertiK) — in progress
- [ ] DappBay listing submission (post-audit)
- [ ] opBNBscan contract verification for all 3 contracts — complete

---

## Phase 2 — Token Launch (Q2 2026)

### $SWARM TGE
- [ ] Production SwarmToken deployed on BNB Smart Chain (BSC, ChainId 56)
- [ ] Full 1B supply distributed in one on-chain transaction via SwarmToken.distribute()
- [ ] 3 Team.Finance vesting locks created: Team (150M, 12mo cliff, 24mo linear), Strategic Round (100M, 12mo cliff, 12mo linear), Strategic Partners (50M, 12mo cliff, 12mo linear)
- [ ] 6 Gnosis Safe multisigs configured for Community, Ecosystem, Marketing, Treasury, Reserve, and Liquidity allocations
- [ ] Ownership of all contracts transferred to Gnosis Safe multisig

### DEX & Exchange Listings
- [ ] PancakeSwap liquidity pool launched (80M SWARM + BNB pair)
- [ ] LP tokens locked on Team.Finance for minimum 12 months
- [ ] OKX listing
- [ ] CoinGecko and CoinMarketCap listings
- [ ] Additional CEX listings initiated

### Community Airdrop
- [ ] TGE snapshot taken of all swarmScore values from SwarmCore
- [ ] Off-chain sybil filtering applied — referral tree analysis, timing patterns, funding source clustering
- [ ] Community airdrop distributed from Gnosis Safe: 20M SWARM (10%) unlocked at TGE, remaining 180M subject to 1-month cliff and 24-month linear vesting
- [ ] Post-TGE platform activity tracking begins (feeds into final community distribution weight)

### Listings & Visibility
- [ ] BscScan contract verification for SwarmToken on BSC
- [ ] DappBay listing live
- [x] GitHub repository published (github.com/Swarm-Base/swarmbase)
- [ ] Bug bounty program launched

---

## Phase 3 — Protocol Activation (Q3 2026)

### Staking & Governance
- [ ] StakeVault.sol deployed on BSC — token staking, delegation to validator nodes, 14-day unbonding period, slashing escrow
- [ ] GovernanceModule.sol deployed on BSC — two-tier governance live (Parameter: 10% quorum, >50% approval; Structural: 20% quorum, >66.7% approval)
- [ ] On-chain governance proposals open to all staked SWARM holders
- [ ] Security Council (5-of-9 multisig) active — 48-hour veto window on all governance proposals
- [ ] Delegated staking live — non-operator holders earn yield by delegating to validator nodes

### Rewards & Fees
- [ ] RewardDistributor.sol deployed on opBNB — epoch-based reward calculation and distribution to swarm participants
- [ ] Protocol fee mechanism activated: 3% on agent task execution (2% burned permanently, 0.5% treasury, 0.5% validators)
- [ ] Burn mechanism live — deflationary pressure begins as swarm usage grows
- [ ] Epoch emissions begin: ~59,932 SWARM per 6-hour epoch (year one), halving annually

### Platform Expansion
- [ ] Agent marketplace live on core.swarmbase.io — browse, deploy, and compose specialized AI agents
- [ ] Real compute tasks routable through the platform with on-chain payment in SWARM
- [ ] Multi-agent workflow support — chain agents sequentially within the platform UI
- [ ] Agent performance tracking — on-chain task completion metrics visible per agent
- [ ] API access for developers — programmatic agent deployment and swarm composition

---

## Phase 4 — Swarm Infrastructure (Q4 2026)

### SwarmCoordinator
- [ ] SwarmCoordinator.sol deployed on opBNB — swarm DAG management, task routing, fault detection, re-routing logic
- [ ] Swarm composition engine live — declarative swarm topology definition
- [ ] Nested swarm support — sub-swarms composable as single nodes in parent swarm graphs
- [ ] Fault-tolerant execution — automatic task reassignment when agents fail or produce low-quality outputs
- [ ] On-chain task routing governed entirely by SwarmCoordinator logic (no centralized dispatcher)

### Verification Layer (Phase 4 begins)
- [ ] VerifierGateway.sol deployed on BSC — proof verification dispatch and routing
- [ ] TEE attestation pipeline live — Intel SGX / AMD SEV hardware enclaves for inference workloads
- [ ] Attestation report submission and hardware signature validation on-chain
- [ ] Only TEE-attested outputs eligible for reward distribution
- [ ] Agent operator onboarding for enclave-equipped infrastructure

### Ecosystem Growth
- [ ] Strategic partnership integrations — AI infrastructure providers, GPU compute networks, Web3 protocols
- [ ] Cross-chain bridge integrations for multi-chain asset routing
- [ ] Developer SDK and documentation for third-party swarm builders
- [ ] Grants program activated from Ecosystem allocation (150M SWARM) to fund external swarm development

---

## Phase 5 — Full Decentralization (2027)

### Proof of Inference Consensus
- [ ] Full PoI consensus layer live — verifiable inference work replaces arbitrary hash computation as the network's consensus primitive
- [ ] Task assignment via SwarmCoordinator routing schedule
- [ ] Output bundle submission: result + TEE attestation or ZKML proof + model identifier + input hash + compute metrics
- [ ] Two-thirds validator supermajority finalization for all task outputs
- [ ] Dual-granularity tracking: individual agent contributions measured, swarm-level outcomes evaluated

### ZKML Proof System
- [ ] PLONK-based zk-SNARK prover deployed — mathematical soundness guarantees for inference outputs
- [ ] Transformer architecture support up to 7B parameters
- [ ] GPU-accelerated proving — target proof generation under 30 seconds for standard inference workloads
- [ ] Recursive proof composition — single aggregated proof attests to entire multi-agent swarm execution graph
- [ ] TEE attestation and ZKML proofs operational simultaneously — operators choose based on infrastructure and security requirements

### VRF Committee Selection
- [ ] VRF mechanism live — threshold BLS signatures produce a random beacon each epoch
- [ ] Beacon output determines: next epoch's validator committee composition, task routing seeds, probabilistic protocol parameters
- [ ] No participant can predict or manipulate committee assignments

### Governance Maturity
- [ ] Security Council authority reduction initiated via governance vote (targeting full dissolution 24 months post-mainnet launch)
- [ ] Progressive decentralization milestones: council veto window reduced, then removed
- [ ] Full community governance over all protocol parameters and treasury
- [ ] DAO treasury operational — Ecosystem and Treasury Gnosis Safe allocations transitioned to governance control

---

## Technical Specifications Reference

| Parameter | Value |
|---|---|
| Token | $SWARM |
| Standard | BEP-20 on BSC (production) |
| Total Supply | 1,000,000,000 (fixed, no mint) |
| Engagement Layer | opBNB Mainnet (ChainId 204) |
| Token Chain | BSC (ChainId 56) |
| Epoch Duration | 6 hours (Phase 3+) |
| Unbonding Period | 14 days (Phase 3+) |
| Min Validator Stake | 50,000 SWARM (Phase 3+) |
| Protocol Fee | 3% (2% burn, 0.5% treasury, 0.5% validators) |
| Platform | core.swarmbase.io |

---

*SwarmBase Ltd. — Republic of the Marshall Islands*
*swarmbase.io | core.swarmbase.io*
