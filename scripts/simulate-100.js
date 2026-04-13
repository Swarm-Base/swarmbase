/**
 * SwarmBase — 100-Wallet Realistic Simulation
 *
 * Simulates a realistic community launch with:
 *   - Multi-hop referral tree (4 tiers)
 *   - Varied behaviour: active / passive / inactive / power users
 *   - Pioneer NFT mints
 *   - Organic check-in patterns
 *
 * Safe to re-run — skips already-registered wallets.
 * Run: PRIVATE_KEY=0x... node scripts/simulate-100.js
 */

const { ethers } = require("ethers");
const fs   = require("fs");
const path = require("path");
require("dotenv").config();

// ─── CONFIG ────────────────────────────────────────────────────────────────

const RPC          = "https://opbnb.publicnode.com";
const CORE_ADDR    = "0x333628c9e0C3B300558C1a998534001A31F12314";
const BADGE_ADDR   = "0xD84296141E1BD55F2B57A5fA62c8254eFbCED08c";
const WALLETS_FILE = path.join(__dirname, "../sim-wallets.json");
const FUND_AMOUNT  = ethers.parseEther("0.00005"); // per wallet

const CORE_ABI = [
  "function register() external",
  "function registerWithReferral(address referrer) external",
  "function hiveCheckIn() external",
  "function registered(address) view returns (bool)",
  "function lastHiveCheckIn(address) view returns (uint256)",
  "function swarmScore(address) view returns (uint256)",
  "function totalCheckIns(address) view returns (uint256)",
];
const BADGE_ABI = [
  "function mintPioneer() external",
  "function hasBadge(address, uint256) view returns (bool)",
  "function mintBuilder() external",
  "function getEligibility(address) view returns (bool,bool,bool,bool,bool,bool)",
];

// ─── HELPERS ───────────────────────────────────────────────────────────────

const provider = new ethers.JsonRpcProvider(RPC);
const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function send(wallet, contract, method, args = [], label = "") {
  try {
    const tx = await contract.connect(wallet)[method](...args, {
      gasLimit: 300_000,
      gasPrice: ethers.parseUnits("0.002", "gwei"),
    });
    await tx.wait();
    process.stdout.write(`  ✓ ${label || method}\n`);
    return true;
  } catch (e) {
    const msg = e?.reason || e?.message || String(e);
    if (msg.includes("Already registered") ||
        msg.includes("Pioneer already minted") ||
        msg.includes("Already checked in today")) {
      process.stdout.write(`  · ${label || method} (already done)\n`);
      return false;
    }
    process.stdout.write(`  ✗ ${label || method}: ${msg.slice(0, 80)}\n`);
    return false;
  }
}

// ─── WALLET GENERATION ─────────────────────────────────────────────────────

function loadOrCreateWallets() {
  if (fs.existsSync(WALLETS_FILE)) {
    console.log("📂 Loading existing wallets from sim-wallets.json");
    return JSON.parse(fs.readFileSync(WALLETS_FILE));
  }

  console.log("🔑 Generating 100 wallets...");
  const wallets = Array.from({ length: 100 }, (_, i) => {
    const w = ethers.Wallet.createRandom();
    return { index: i, address: w.address, privateKey: w.privateKey };
  });
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
  console.log("   Saved to sim-wallets.json\n");
  return wallets;
}

// ─── FUND WALLETS ──────────────────────────────────────────────────────────

async function fundWallets(wallets) {
  console.log("\n💸 Funding wallets (0.00005 BNB each)...");
  const balance = await provider.getBalance(deployer.address);
  console.log(`   Deployer balance: ${ethers.formatEther(balance)} BNB`);

  let funded = 0;
  for (const w of wallets) {
    const bal = await provider.getBalance(w.address);
    if (bal >= ethers.parseEther("0.00001")) { process.stdout.write("."); continue; }
    try {
      const tx = await deployer.sendTransaction({
        to: w.address,
        value: FUND_AMOUNT,
        gasLimit: 21000,
        gasPrice: ethers.parseUnits("0.002", "gwei"),
      });
      await tx.wait();
      funded++;
      process.stdout.write("+");
    } catch (e) {
      process.stdout.write("!");
    }
    await sleep(100);
  }
  console.log(`\n   Funded ${funded} new wallets\n`);
}

// ─── SIMULATION PLAN ──────────────────────────────────────────────────────
//
// Tier structure (index ranges):
//   [0–4]   Founders     — 5 wallets, register direct
//   [5–19]  Early        — 15 wallets, referred by Founders (3 per founder)
//   [20–49] Community    — 30 wallets, referred by Early (2 per early adopter)
//   [50–69] Casual       — 20 wallets, 10 referred by Community, 10 direct
//   [70–84] Passive      — 15 wallets, register + mint Pioneer, no check-in
//   [85–99] Inactive     — 15 wallets, register only (never check in, never mint)
//
// Behaviour:
//   Founders   : register → check-in → mint Pioneer
//   Early      : register with referral → check-in → mint Pioneer
//   Community  : register with referral → 80% check-in → mint Pioneer
//   Casual     : mixed referral → 60% check-in → mint Pioneer
//   Passive    : register → mint Pioneer (no check-in)
//   Inactive   : register only

function buildPlan(wallets) {
  const addr = i => wallets[i].address;
  const plan = [];

  // Founders [0–4]: register direct
  for (let i = 0; i < 5; i++) {
    plan.push({ index: i, type: "founder", referrer: null, checkIn: true, mintPioneer: true });
  }

  // Early [5–19]: 3 per founder
  for (let i = 5; i < 20; i++) {
    const founderIdx = Math.floor((i - 5) / 3);
    plan.push({ index: i, type: "early", referrer: addr(founderIdx), checkIn: true, mintPioneer: true });
  }

  // Community [20–49]: 2 per early adopter
  for (let i = 20; i < 50; i++) {
    const earlyIdx = 5 + Math.floor((i - 20) / 2);
    plan.push({ index: i, type: "community", referrer: addr(earlyIdx), checkIn: (i % 5 !== 0), mintPioneer: true });
  }

  // Casual [50–59]: referred by community wallets
  for (let i = 50; i < 60; i++) {
    const communityIdx = 20 + (i - 50);
    plan.push({ index: i, type: "casual", referrer: addr(communityIdx), checkIn: (i % 3 !== 0), mintPioneer: true });
  }

  // Casual [60–69]: register direct
  for (let i = 60; i < 70; i++) {
    plan.push({ index: i, type: "casual-direct", referrer: null, checkIn: (i % 3 !== 0), mintPioneer: (i % 4 !== 0) });
  }

  // Passive [70–84]: register + mint, no check-in
  for (let i = 70; i < 85; i++) {
    plan.push({ index: i, type: "passive", referrer: null, checkIn: false, mintPioneer: true });
  }

  // Inactive [85–99]: register only
  for (let i = 85; i < 100; i++) {
    plan.push({ index: i, type: "inactive", referrer: null, checkIn: false, mintPioneer: false });
  }

  return plan;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║   SwarmBase — 100-Wallet Simulation  ║");
  console.log("╚══════════════════════════════════════╝\n");

  const walletData = loadOrCreateWallets();
  const wallets    = walletData.map(w => new ethers.Wallet(w.privateKey, provider));
  const core       = new ethers.Contract(CORE_ADDR, CORE_ABI, provider);
  const badge      = new ethers.Contract(BADGE_ADDR, BADGE_ABI, provider);

  await fundWallets(walletData);

  const plan = buildPlan(walletData);

  // ── PHASE 1: REGISTRATIONS ─────────────────────────────────────────────
  console.log("📋 Phase 1: Registrations\n");

  let regCount = 0, refCount = 0;
  for (const p of plan) {
    const w = wallets[p.index];
    process.stdout.write(`[${String(p.index).padStart(3)}] ${p.type.padEnd(14)} `);

    if (p.referrer) {
      const ok = await send(w, core, "registerWithReferral", [p.referrer], `register (ref: ${p.referrer.slice(0,6)})`);
      if (ok) { regCount++; refCount++; }
    } else {
      const ok = await send(w, core, "register", [], "register (direct)");
      if (ok) regCount++;
    }
    await sleep(150);
  }
  console.log(`\n   Registered: ${regCount} new  |  With referral: ${refCount}\n`);

  // ── PHASE 2: CHECK-INS ─────────────────────────────────────────────────
  console.log("✅ Phase 2: Check-ins\n");

  let ciCount = 0;
  for (const p of plan.filter(p => p.checkIn)) {
    const w = wallets[p.index];
    process.stdout.write(`[${String(p.index).padStart(3)}] ${p.type.padEnd(14)} `);
    const ok = await send(w, core, "hiveCheckIn", [], "check-in");
    if (ok) ciCount++;
    await sleep(150);
  }
  console.log(`\n   Checked in: ${ciCount} wallets\n`);

  // ── PHASE 3: PIONEER MINTS ─────────────────────────────────────────────
  console.log("🏅 Phase 3: Pioneer NFT Mints\n");

  let mintCount = 0;
  for (const p of plan.filter(p => p.mintPioneer)) {
    const w = wallets[p.index];
    process.stdout.write(`[${String(p.index).padStart(3)}] ${p.type.padEnd(14)} `);
    const ok = await send(w, badge, "mintPioneer", [], "mint Pioneer");
    if (ok) mintCount++;
    await sleep(150);
  }
  console.log(`\n   Pioneer NFTs minted: ${mintCount}\n`);

  // ── PHASE 4: BUILDER MINTS (eligible wallets only) ─────────────────────
  console.log("🏗️  Phase 4: Builder NFT Mints (score ≥ 1,000)\n");

  let builderCount = 0;
  for (const p of plan) {
    const w = wallets[p.index];
    const score = await core.swarmScore(w.address);
    const scoreHuman = parseFloat(ethers.formatEther(score));
    if (scoreHuman >= 1000) {
      process.stdout.write(`[${String(p.index).padStart(3)}] score=${scoreHuman.toFixed(0)} pts  `);
      const ok = await send(w, badge, "mintBuilder", [], "mint Builder");
      if (ok) builderCount++;
      await sleep(150);
    }
  }
  if (builderCount === 0) console.log("   No wallets at Builder threshold yet (expected — day 1 only)");
  console.log(`\n   Builder NFTs minted: ${builderCount}\n`);

  // ── SUMMARY ────────────────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════╗");
  console.log("║   SIMULATION COMPLETE                ║");
  console.log("╚══════════════════════════════════════╝");

  let totalScore = 0n;
  for (const w of wallets) {
    totalScore += await core.swarmScore(w.address);
  }

  const bal = await provider.getBalance(deployer.address);
  console.log(`\nContracts:`);
  console.log(`  SwarmCore:  ${CORE_ADDR}`);
  console.log(`  SwarmBadge: ${BADGE_ADDR}`);
  console.log(`\nStats:`);
  console.log(`  Total wallets     : 100`);
  console.log(`  Registrations     : ${regCount}`);
  console.log(`  With referral     : ${refCount}`);
  console.log(`  Check-ins         : ${ciCount}`);
  console.log(`  Pioneer mints     : ${mintCount}`);
  console.log(`  Builder mints     : ${builderCount}`);
  console.log(`  Total score issued: ${ethers.formatEther(totalScore)} pts`);
  console.log(`\n  Deployer balance  : ${ethers.formatEther(bal)} BNB`);
  console.log(`\nView on opBNBscan: https://opbnbscan.com/address/${CORE_ADDR}`);
}

main().catch(console.error);
