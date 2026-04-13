# SwarmBase

> The cognitive backbone of agentic swarms.

SwarmBase is a Web3 protocol providing AI agent infrastructure and compute orchestration on BNB Chain. The protocol enables businesses and developers to deploy, coordinate, and monetise AI agent swarms entirely on-chain — with verifiable inference, transparent compute markets, and a native token economy.

---

## Protocol

SwarmBase provides the infrastructure layer for on-chain AI agent coordination:

- **Agent swarm orchestration** — deploy and coordinate multi-agent AI systems on-chain
- **Verifiable compute** — every inference and action is provable and auditable
- **Compute marketplace** — permissionless market for AI compute tasks
- **$SWARM token economy** — pay for compute, stake for governance, access premium capabilities

Full technical specification: [swarmbase.io/whitepaper](https://swarmbase.io/whitepaper)

---

## Pre-TGE Phase — Community Engagement Layer

The contracts in this repository represent the **pre-TGE phase only** — a community-building mechanism that runs before the $SWARM token launches. This is not the core protocol. Its purpose is to:

1. Build a verified on-chain record of early community participation
2. Create a fair, sybil-resistant basis for the initial $SWARM airdrop
3. Demonstrate real user engagement to exchanges and investors ahead of TGE

### Contracts (opBNB Mainnet)

| Contract | Purpose | Address |
|---|---|---|
| **SwarmCore** | Records participation — registrations, daily check-ins, referral graph, SwarmScore | *TBA — deploying soon* |
| **SwarmBadge** | Soulbound NFT badges awarded at SwarmScore milestones | *TBA — deploying soon* |

> **SwarmToken ($SWARM)** deploys on **BSC** at TGE — not part of the pre-TGE phase.

### SwarmScore

Every on-chain action earns SwarmScore — the sybil-resistant signal used to determine airdrop eligibility.

| Action | Points |
|---|---|
| Register | 100 |
| Daily check-in | 10 |
| 7-day streak bonus | 50 |
| 30-day streak bonus | 200 |
| Referral (direct) | 150 |
| Referral (depth 2) | 75 |
| Referral (depth 3) | 25 |

### NFT Badges

Three soulbound (non-transferable) badges — permanent proof of early participation.

| Badge | Requirement | Supply |
|---|---|---|
| **Pioneer** | Register on SwarmCore | Unlimited |
| **Builder** | Reach 1,000 SwarmScore | Unlimited |
| **OG** | Reach 5,000 SwarmScore + 14 days on-chain | Max 5,000 |

Badge metadata and images: [github.com/Swarm-Base/nft-metadata](https://github.com/Swarm-Base/nft-metadata)

---

## $SWARM Token

$SWARM launches on BNB Smart Chain (BSC) at TGE.

- **Total supply:** 1,000,000,000 (fixed, no mint function)
- **Utility:** compute payments, governance staking, premium agent access
- **Burn:** 20% of all platform fees permanently burned
- **Distribution:** community airdrop based on pre-TGE SwarmScore snapshot

---

## Links

| | |
|---|---|
| App | [app.swarmbase.io](https://app.swarmbase.io) |
| Website | [swarmbase.io](https://swarmbase.io) |
| Whitepaper | [swarmbase.io/whitepaper](https://swarmbase.io/whitepaper) |
| Twitter / X | [x.com/SwarmBase](https://x.com/SwarmBase) |
| Telegram | [t.me/Swarm_Base](https://t.me/Swarm_Base) |
| Smart Contracts | [github.com/Swarm-Base/contracts](https://github.com/Swarm-Base/contracts) |
| NFT Metadata | [github.com/Swarm-Base/nft-metadata](https://github.com/Swarm-Base/nft-metadata) |

---

*opBNB for the pre-TGE engagement layer. BSC for $SWARM at TGE.*
