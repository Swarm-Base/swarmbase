# SwarmBase — Project Overview

## What is SwarmBase?

SwarmBase is a Web3 protocol that provides AI agent infrastructure and compute orchestration on BNB Chain. The protocol enables businesses and developers to deploy, coordinate, and monetise AI agent swarms on-chain.

The pre-TGE engagement layer — which these contracts represent — is a community-building phase that runs **before** the $SWARM token launches. Its purpose is to:

1. Build a verified on-chain record of early community participation
2. Create a fair, sybil-resistant basis for the initial $SWARM airdrop
3. Demonstrate real user engagement to exchanges and investors

## The $SWARM Token

$SWARM is the native utility token of the SwarmBase protocol, deployed as a **BEP-20 token on BNB Smart Chain (BSC, ChainId 56)** at TGE. It is used to:
- Pay for AI compute tasks on the protocol
- Stake for governance rights
- Access premium agent capabilities

At TGE, 20% of all platform fees are permanently burned, creating deflationary pressure.

> **Chain note:** The $SWARM token production deployment is on **BSC**. The pre-TGE SwarmToken deployment on opBNB Mainnet (ChainId 204) exists solely for community engagement testing and will not be the live token. SwarmCore and SwarmBadge remain on opBNB as the pre-TGE engagement layer.

## How the Engagement Layer Works

During the pre-TGE phase, users interact with three on-chain contracts:

**SwarmCore** — records all engagement. Users register once, check in daily, and refer others. Every action updates their `swarmScore` — a purely on-chain engagement signal.

**SwarmBadge** — issues soulbound NFT badges based on `swarmScore` milestones. Badges are permanent, non-transferable proof of early participation.

**SwarmToken** — the $SWARM token contract. Deployed pre-TGE with full supply held by owner until distribution is triggered.

## Why On-Chain?

All engagement is recorded on-chain (opBNB Mainnet) because:
- It is publicly verifiable by anyone — users, exchanges, investors, auditors
- It cannot be falsified retroactively
- It creates a trustless record for the airdrop snapshot
- It demonstrates real transaction volume on the protocol before token launch

## What Happens at TGE

1. Owner calls `SwarmToken.setWallets()` with 9 pre-approved addresses (Gnosis Safes + Team.Finance contracts)
2. Owner calls `SwarmToken.distribute()` — full 1B supply distributed in one transaction
3. A snapshot of all `swarmScore` values is taken from SwarmCore
4. Off-chain sybil filtering is applied (cluster analysis, timing patterns, referral trees)
5. Filtered scores are used to determine each wallet's $SWARM airdrop allocation from the 200M community pool
6. Airdrop is distributed from the community Gnosis Safe — no on-chain airdrop contract

## What These Contracts Do NOT Do

- They do not promise any specific token amount to any wallet
- They do not contain a fixed point-to-token conversion rate
- They do not handle vesting (Team.Finance handles this externally)
- They do not reference the token address from the engagement contracts
- SwarmCore does not know about $SWARM — it only records engagement signals

This separation is intentional: the engagement layer is clean and independent. The token launch mechanics are entirely separate.
