/**
 * SwarmBase — Full Deployment Script
 *
 * Chain deployment guide:
 *   - SwarmCore + SwarmBadge → opBNB Mainnet (ChainId 204) — pre-TGE engagement layer
 *   - SwarmToken ($SWARM)    → BNB Smart Chain (ChainId 56)  — production TGE token
 *
 * This script deploys all three to the same network for the pre-TGE phase.
 * At TGE, SwarmToken must be redeployed on BSC separately.
 *
 * Deployment Order:
 *   1. SwarmToken ($SWARM)
 *   2. SwarmCore  (engagement mechanics)
 *   3. SwarmBadge (soulbound badges — needs SwarmCore address)
 *
 * Vesting: handled via Team.Finance (no on-chain vesting contract)
 * Airdrop:  distributed from Gnosis Safe at TGE at owner's discretion
 *
 * Usage (pre-TGE engagement, opBNB):
 *   PRIVATE_KEY=0x... npm run deploy:opbnb
 *
 * Usage (production token, BSC):
 *   PRIVATE_KEY=0x... npm run deploy:bsc
 *
 * ⚠️  PRODUCTION DEPLOY: owner must be a Gnosis Safe multisig, not an EOA.
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   SwarmBase — Deployment             ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`\nDeployer:  ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:   ${ethers.formatEther(balance)} BNB`);
  console.log(`Network:   ${(await ethers.provider.getNetwork()).chainId}\n`);

  // ─── 1. SWARM TOKEN ──────────────────────────────────────────────────────

  console.log("1. Deploying SwarmToken ($SWARM)...");
  const SwarmToken = await ethers.getContractFactory("SwarmToken");
  const token = await SwarmToken.deploy(deployer.address);
  await token.waitForDeployment();
  console.log(`   ✅ SwarmToken:   ${token.target}`);

  // ─── 2. SWARM CORE ───────────────────────────────────────────────────────

  console.log("\n2. Deploying SwarmCore...");
  const SwarmCore = await ethers.getContractFactory("SwarmCore");
  const core = await SwarmCore.deploy();
  await core.waitForDeployment();
  console.log(`   ✅ SwarmCore:    ${core.target}`);

  // ─── 3. SWARM BADGE ──────────────────────────────────────────────────────

  console.log("\n3. Deploying SwarmBadge...");
  const baseURI = "https://swarm-base.github.io/nft-metadata/"; // NFT metadata hosted on GitHub Pages
  const SwarmNFT = await ethers.getContractFactory("SwarmBadge");
  const nft = await SwarmNFT.deploy(core.target, baseURI);
  await nft.waitForDeployment();
  console.log(`   ✅ SwarmBadge:   ${nft.target}`);
  console.log(`   ✅ SwarmCore linked: ${core.target}`);

  // ─── 4. LINK TOKEN → SWARMCORE ───────────────────────────────────────────

  console.log("\n4. Linking SwarmToken → SwarmCore...");
  const setCoreTx = await token.setSwarmCore(core.target);
  await setCoreTx.wait();
  console.log(`   ✅ SwarmCore set on SwarmToken`);

  // ─── 5. DISTRIBUTE TOKENS ────────────────────────────────────────────────
  //
  // NOTE: Set wallet addresses before calling distribute().
  //       Replace with actual wallet addresses before mainnet deploy.
  //
  // Example (uncomment and fill in real addresses):
  //
  // console.log("\n5. Distributing tokens...");
  // const setWalletsTx = await token.setWallets(
  //   "0xCOMMUNITY",    // community  — Gnosis Safe
  //   "0xTEAM",          // team       — Team.Finance lock
  //   "0xECOSYSTEM",     // ecosystem  — Gnosis Safe
  //   "0xMARKETING",     // marketing  — Gnosis Safe
  //   "0xSTRATEGIC",     // strategic round — Team.Finance lock
  //   "0xTREASURY",      // treasury   — Gnosis Safe
  //   "0xLIQUIDITY",     // liquidity  — LP pool (Team.Finance LP lock)
  //   "0xRESERVE",       // reserve    — Gnosis Safe
  //   "0xPARTNERS"       // strategic partners — Team.Finance lock
  // );
  // await setWalletsTx.wait();
  // const distributeTx = await token.distribute();
  // await distributeTx.wait();
  // console.log("   ✅ Tokens distributed to all wallets");

  // ─── SUMMARY ─────────────────────────────────────────────────────────────

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║   DEPLOYMENT COMPLETE                ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`\nSwarmToken ($SWARM):  ${token.target}`);
  console.log(`SwarmCore:            ${core.target}`);
  console.log(`SwarmBadge:           ${nft.target}`);
  console.log(`Vesting:              Team.Finance`);
  console.log(`Airdrop:              Gnosis Safe (TGE discretionary)`);

  console.log("\n─── NEXT STEPS ────────────────────────");
  console.log("1. Set wallet addresses: SwarmToken.setWallets()");
  console.log("2. Call SwarmToken.distribute()");
  console.log("3. Lock SwarmCore: SwarmToken.lockSwarmCore()");
  console.log("4. Lock SwarmCore: SwarmBadge.lockSwarmCore()");
  console.log("5. Verify all contracts on opBNBscan");
  console.log("6. Create Team.Finance locks for Team / Strategic Round / Strategic Partners");
  console.log("7. Lock LP tokens on Team.Finance after DEX listing");
  console.log("8. Submit to DappBay");
  console.log("────────────────────────────────────────\n");

  // Save addresses to file for reference
  const fs = require("fs");
  const addresses = {
    network: "opBNB Mainnet",
    chainId: 204,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      SwarmToken:  token.target,
      SwarmCore:   core.target,
      SwarmBadge:  nft.target,
      Vesting:     "Team.Finance",
      Airdrop:     "Gnosis Safe — TGE discretionary"
    }
  };
  fs.writeFileSync("deployment-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to deployment-addresses.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
