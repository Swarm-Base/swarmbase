# Contract Architecture

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                        USER                             │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────▼────────┐         ┌──────────────────────┐
    │   SwarmCore     │◄────────│     SwarmBadge        │
    │                 │ reads   │                       │
    │ - register()    │ score + │ - mintPioneer()       │
    │ - hiveCheckIn() │ regTime │ - mintBuilder()       │
    │ - register      │         │ - mintOG()            │
    │   WithReferral()│         │ - getEligibility()    │
    │                 │         │                       │
    │ swarmScore[]    │         │ ERC-1155 soulbound    │
    │ totalCheckIns[] │         │ Pioneer / Builder / OG│
    │ referralMileston│         └──────────────────────┘
    │ invitedBy[]     │
    └────────┬────────┘         ┌──────────────────────┐
             │                  │     SwarmToken        │
             │                  │                       │
             │   (no link)      │ - setWallets()        │
             │                  │ - distribute()        │
             │                  │ - lockSwarmCore()     │
             │                  │                       │
             │                  │ 1B $SWARM BEP-20      │
             │                  └──────────────────────┘
             │
    ┌────────▼────────────────────────────────────────┐
    │               opBNBscan (public)                 │
    │   All events indexed — fully transparent         │
    └─────────────────────────────────────────────────┘
```

## Contract Relationships

### SwarmCore → SwarmBadge
SwarmBadge reads from SwarmCore via an interface:
```solidity
interface ISwarmCore {
    function registered(address user) external view returns (bool);
    function swarmScore(address user) external view returns (uint256);
    function registrationTime(address user) external view returns (uint256);
}
```
SwarmBadge holds a reference to the SwarmCore address (`swarmCore`). This reference is permanently locked after deploy via `lockSwarmCore()` — it cannot be changed afterwards.

### SwarmToken → SwarmCore
SwarmToken holds an optional reference to SwarmCore (`swarmCoreAddress`) for informational purposes. This does not affect token mechanics — it is purely metadata. The reference is also locked via `lockSwarmCore()`.

### SwarmCore — completely standalone
SwarmCore has no external dependencies. It does not call any other contract. All state changes are self-contained.

---

## State Machine — SwarmCore

```
WALLET STATE:

  Unregistered
       │
       │  register() OR registerWithReferral()
       │  → +50 pts welcome bonus
       │  → referrer gets +10 pts (if referral)
       ▼
   Registered ──────────────────────────────────────────────────────┐
       │                                                             │
       │  hiveCheckIn() [once per 24h]                              │
       │  → +25 to +76 pts (streak multiplier)                      │
       │  → streak milestone bonuses at 7/30/90 lifetime check-ins  │
       │  → referral milestones if invitedBy != 0                   │
       │                                                             │
       ▼                                                             │
   totalCheckIns++  ◄───────────────────────────────────────────────┘
       │
       │  (if invitedBy[user] != 0)
       │
       ├── ci == 3  AND milestone == 0 → referrer +100 pts, milestone = 1
       ├── ci == 7  AND milestone == 1 → referrer  +50 pts, milestone = 2
       ├── ci == 30 AND milestone == 2 → referrer +200 pts, milestone = 3
       └── ci == 90 AND milestone == 3 → referrer +500 pts, milestone = 4
```

## State Machine — SwarmBadge

```
BADGE STATE (per wallet):

  Pioneer [ID 1]: open to all registered wallets, mintable once
  Builder [ID 2]: requires swarmScore >= 1,000e18, mintable once
  OG      [ID 3]: requires swarmScore >= 5,000e18 + registered >= 14 days
                  hard supply cap: 5,000 total minted ever

  All badges: soulbound — transfer always reverts
              non-burnable
              permanent once minted
```

---

## Deployment Sequence

```
1. Deploy SwarmToken(owner)
   └─ owner holds full 1B supply

2. Deploy SwarmCore()
   └─ standalone, no constructor args

3. Deploy SwarmBadge(swarmCoreAddress, baseURI)
   └─ links to SwarmCore at construction

4. SwarmToken.setSwarmCore(swarmCoreAddress)
   └─ informational link only

5. SwarmBadge.lockSwarmCore()
   └─ permanently freezes the SwarmCore reference
      swarmCoreAddress can never be changed again

6. SwarmToken.lockSwarmCore()
   └─ permanently freezes SwarmToken's SwarmCore reference
```

---

## Scoring Formula

```
Daily check-in score:
  mult  = 100 + (streak - 1) * 7       // streak capped at 30
  score = (25e18 * mult) / 100

  streak=1  → mult=100 → score = 25e18   (25 pts)
  streak=10 → mult=163 → score = 40.75e18
  streak=30 → mult=303 → score = 75.75e18

Milestone bonuses (lifetime check-ins):
  ci % 90 == 0  → +1500e18
  ci % 30 == 0  → +500e18
  ci % 7  == 0  → +150e18
  (highest tier takes priority — else-if chain)

All scores stored with 18 decimal places (ERC20-style precision).
Frontend displays via ethers.formatEther().
```

---

## Events Emitted

```solidity
// SwarmCore
UserRegistered(address indexed user, uint256 timestamp)
HiveCheckIn(address indexed user, uint256 streak, uint256 score, uint256 timestamp)
ReferralCompleted(address indexed referrer, address indexed referee, uint256 score, uint256 timestamp)
ReferralMilestoneAwarded(address indexed referrer, address indexed referee, uint256 checkIns, uint256 bonus, uint256 timestamp)
StreakMilestone(address indexed user, uint256 checkInCount, uint256 bonus, uint256 timestamp)
Paused(uint256 timestamp)
Unpaused(uint256 timestamp)

// SwarmBadge
(standard ERC-1155 TransferSingle event on mint)

// SwarmToken
(standard ERC-20 Transfer events)
```
