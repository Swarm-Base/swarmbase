# SwarmBase

> The on-chain community intelligence layer for Web3.

SwarmBase rewards real community participation — not bots, not airdrop farmers. Every action is verified on-chain, every score is transparent, every badge is earned.

---

## What is SwarmBase?

SwarmBase is a points-and-reputation system built on opBNB. Projects use SwarmBase to identify, reward, and retain their most committed community members — with soulbound NFT badges, verifiable on-chain scores, and a referral graph that surfaces genuine influence.

---

## Core Contracts

| Contract | Network | Address |
|---|---|---|
| SwarmCore | opBNB | *TBA — pre-TGE deploy* |
| SwarmBadge | opBNB | *TBA — pre-TGE deploy* |
| SwarmToken | BSC | *TBA — TGE* |

Smart contract source code and audit reports: [github.com/Swarm-Base/contracts](https://github.com/Swarm-Base/contracts)

---

## NFT Badges

Three soulbound badges — non-transferable, earned, permanent.

| Badge | Requirement | Supply |
|---|---|---|
| **Pioneer** | Register on SwarmCore | Unlimited |
| **Builder** | Reach 1,000 SwarmScore | Unlimited |
| **OG** | Reach 5,000 SwarmScore + 14 days on-chain | Max 5,000 |

Badge metadata and images: [github.com/Swarm-Base/nft-metadata](https://github.com/Swarm-Base/nft-metadata)

Preview:
- `images/1.svg` — Pioneer
- `images/2.svg` — Builder  
- `images/3.svg` — OG

---

## SwarmScore

SwarmScore is your on-chain reputation within the SwarmBase ecosystem.

| Action | Points |
|---|---|
| Register | 100 |
| Daily check-in | 10 |
| Streak bonus (7-day) | 50 |
| Streak bonus (30-day) | 200 |
| Referral (direct) | 150 |
| Referral (depth 2) | 75 |
| Referral (depth 3) | 25 |

Scores are stored on SwarmCore and used as the eligibility source for badge minting.

---

## Token — SwarmToken (SWM)

SwarmToken launches on BSC at TGE. It is not deployed yet.

- **Total supply:** 1,000,000,000 SWM (fixed, no mint)
- **Burn:** 20% of protocol fees burned via `burnFees()` 
- **Utility:** governance, fee payment, staking, badge unlocks

Full tokenomics in the [whitepaper](https://swarmbase.io/whitepaper).

---

## Links

| | |
|---|---|
| App | [app.swarmbase.io](https://app.swarmbase.io) |
| Website | [swarmbase.io](https://swarmbase.io) |
| Whitepaper | [swarmbase.io/whitepaper](https://swarmbase.io/whitepaper) |
| Twitter / X | [x.com/SwarmBase](https://x.com/SwarmBase) |
| Telegram | [t.me/Swarm_Base](https://t.me/Swarm_Base) |
| Contracts repo | [github.com/Swarm-Base/contracts](https://github.com/Swarm-Base/contracts) |
| NFT Metadata | [github.com/Swarm-Base/nft-metadata](https://github.com/Swarm-Base/nft-metadata) |

---

## Security

SwarmBadges are soulbound (non-transferable). SwarmCore ownership is held by a Gnosis Safe multisig post-deploy. All contracts have been audited prior to deployment.

---

*Built on opBNB. Tokens on BSC. Powered by the community.*
