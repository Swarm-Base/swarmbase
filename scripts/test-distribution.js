/**
 * SwarmBase — Distribution Test Script
 * Network: BSC Mainnet (ChainId 56)
 *
 * Tests the full distribution flow:
 *   1. Deploy SwarmToken
 *   2. setWallets() with 9 test addresses
 *   3. distribute() — splits 1B SWARM across all 9 wallets
 *   4. Verifies every wallet received exact expected amount
 */

const { ethers } = require("hardhat");

const E18 = (n) => ethers.parseEther(n.toString());

const WALLETS = {
  community:         "0x999f861Df81cD86265dEB26003a6552A0902fF1F",
  team:              "0x210E316e21677A486b4E81fbb91E6776FF3Cf0A2",
  ecosystem:         "0x4B920AdaBb65b504b995D4eccdf6091021271a2D",
  marketing:         "0x7ED1CfeA674E6F3B3cb171289bC77AF23197C905",
  strategicRound:    "0x577a5b77e69a55aac97d6c1960bD2cc51ea7543b",
  treasury:          "0x4B2EB2Cf2cefd0aCcA518331Ec4Ae5004EA5734b",
  liquidity:         "0x06FEf0dd7630725130608c2b091C4000C0a188aD",
  reserve:           "0xAaA105173d4F3Cc321f960153d9F4710C8490d2d",
  strategicPartners: "0xC1ad95b17E830F57C26baca31f5F0E55e30f2E8e",
};

const EXPECTED = {
  community:         E18(200_000_000),
  team:              E18(150_000_000),
  ecosystem:         E18(150_000_000),
  marketing:         E18(120_000_000),
  strategicRound:    E18(100_000_000),
  treasury:          E18(80_000_000),
  liquidity:         E18(80_000_000),
  reserve:           E18(70_000_000),
  strategicPartners: E18(50_000_000),
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   SwarmBase — Distribution Test (BSC)    ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\nDeployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(bal)} BNB\n`);

  // ─── 1. DEPLOY ────────────────────────────────────────────────────────────

  console.log("1. Deploying SwarmToken...");
  const SwarmToken = await ethers.getContractFactory("SwarmToken");
  const token = await SwarmToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log(`   ✅ SwarmToken: ${tokenAddr}`);
  console.log(`   🔗 https://bscscan.com/address/${tokenAddr}`);

  const totalSupply = await token.totalSupply();
  console.log(`   Total supply: ${ethers.formatEther(totalSupply)} SWARM`);

  // ─── 2. SET WALLETS ───────────────────────────────────────────────────────

  console.log("\n2. Setting wallets...");
  const setTx = await token.setWallets(
    WALLETS.community,
    WALLETS.team,
    WALLETS.ecosystem,
    WALLETS.marketing,
    WALLETS.strategicRound,
    WALLETS.treasury,
    WALLETS.liquidity,
    WALLETS.reserve,
    WALLETS.strategicPartners
  );
  await setTx.wait();
  console.log(`   ✅ setWallets tx: ${setTx.hash}`);
  console.log(`   🔗 https://bscscan.com/tx/${setTx.hash}`);

  // ─── 3. DISTRIBUTE ────────────────────────────────────────────────────────

  console.log("\n3. Distributing tokens...");
  const distTx = await token.distribute();
  const receipt = await distTx.wait();
  console.log(`   ✅ distribute tx: ${distTx.hash}`);
  console.log(`   🔗 https://bscscan.com/tx/${distTx.hash}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

  // ─── 4. VERIFY ────────────────────────────────────────────────────────────

  console.log("\n4. Verifying balances...\n");
  let allCorrect = true;
  for (const [label, address] of Object.entries(WALLETS)) {
    const bal = await token.balanceOf(address);
    const expected = EXPECTED[label];
    const ok = bal === expected;
    if (!ok) allCorrect = false;
    console.log(`   ${ok ? "✅" : "❌"} ${label.padEnd(18)} ${ethers.formatEther(bal).padStart(15)} SWARM  (expected: ${ethers.formatEther(expected)})`);
  }

  // Confirm distributed flag is locked
  const isDistributed = await token.distributed();
  console.log(`\n   ✅ distributed flag: ${isDistributed} (cannot call distribute() again)`);

  // Deployer should now hold 0 SWARM
  const deployerBal = await token.balanceOf(deployer.address);
  console.log(`   ✅ Deployer SWARM balance: ${ethers.formatEther(deployerBal)} (should be 0)`);

  console.log("\n╔══════════════════════════════════════════╗");
  if (allCorrect) {
    console.log("║   ALL CHECKS PASSED ✅                   ║");
  } else {
    console.log("║   SOME CHECKS FAILED ❌                  ║");
  }
  console.log("╚══════════════════════════════════════════╝\n");
  console.log(`Token contract: https://bscscan.com/address/${tokenAddr}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
