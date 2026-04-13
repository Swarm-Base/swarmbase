# SwarmBase Tokenomics — $SWARM

## Token

**Standard:** BEP-20 on BNB Smart Chain (BSC, ChainId 56) — production TGE deployment
**Note:** A pre-TGE deploy exists on opBNB Mainnet as the community engagement layer. The production $SWARM token will be a fresh BSC deploy at TGE.

## Total Supply

**1,000,000,000 $SWARM** (fixed, no mint function post-deploy)

---

## Distribution

| Allocation | Tokens | % | Vesting | Recipient |
|---|---|---|---|---|
| Community Airdrop | 200,000,000 | 20% | None | Gnosis Safe → wallets at TGE |
| Team | 150,000,000 | 15% | 12mo cliff, 24mo linear | Team.Finance lock |
| Ecosystem | 150,000,000 | 15% | None | Gnosis Safe |
| Marketing | 120,000,000 | 12% | None | Gnosis Safe |
| Strategic Round | 100,000,000 | 10% | 12mo cliff, 12mo linear | Team.Finance lock |
| Treasury | 80,000,000 | 8% | None | Gnosis Safe |
| Liquidity | 80,000,000 | 8% | LP locked Team.Finance | DEX LP wallet |
| Reserve | 70,000,000 | 7% | None | Gnosis Safe |
| Strategic Partners | 50,000,000 | 5% | 12mo cliff, 12mo linear | Team.Finance lock |

---

## Distribution Mechanics

The `SwarmToken` contract distributes the full 1B supply in **two owner-only transactions**:

**Step 1 — `setWallets()`**

Owner provides 9 addresses before calling distribute. Addresses must all be non-zero. This can only be called once (sets a flag). Intended recipients:
- Community, Ecosystem, Marketing, Treasury, Reserve, Liquidity → Gnosis Safe addresses
- Team, Strategic Round, Strategic Partners → Team.Finance lock contract addresses (pre-configured with correct vesting terms)

**Step 2 — `distribute()`**

Transfers exact allocations to all 9 wallets in a single transaction. Can only be called once. After this call, the owner holds zero tokens.

---

## Vesting

All vesting is handled externally via **Team.Finance** — there is no vesting contract in this repository.

Three Team.Finance locks are created at TGE:
- Team: 150M tokens, 12-month cliff, 24-month linear vest
- Strategic Round: 100M tokens, 12-month cliff, 12-month linear vest
- Strategic Partners: 50M tokens, 12-month cliff, 12-month linear vest

The Team.Finance contract addresses are set in `SwarmToken.setWallets()` — tokens go directly to the lock contracts, never to team member wallets.

---

## DEX Liquidity

The 80M liquidity allocation goes to a dedicated wallet. At TGE, this wallet adds liquidity to PancakeSwap (BNB Chain). LP tokens are immediately locked on Team.Finance for a minimum of 12 months.

---

## Community Airdrop

The 200M community airdrop allocation sits in a Gnosis Safe multisig. At TGE:

1. A snapshot of all `SwarmCore.swarmScore` values is taken
2. Off-chain sybil filtering is applied (cluster analysis of referral trees, timing patterns, funding sources)
3. The filtered score distribution determines each wallet's allocation weight
4. The Safe executes batch transfers to eligible wallets

**There is no on-chain airdrop contract.** Distribution is at the owner's full discretion — the `swarmScore` is a signal, not an entitlement. This design is intentional and documented.

---

## Token Utility (Post-TGE)

- Pay for AI compute tasks on the SwarmBase protocol
- Stake for governance voting rights
- Access premium agent tier features
- 20% of all platform fees permanently burned (deflationary)

---

## No Inflation

The token has no `mint()` function. The 1B supply is the absolute maximum, forever. Once `distribute()` is called, the owner can never create new tokens.
