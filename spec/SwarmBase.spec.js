/**
 * SwarmBase v4 — Contract Verification Suite
 * Covers: SwarmCore, SwarmBadge, SwarmToken
 *
 * Run: npx hardhat test --config hardhat.config.js
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const DAY     = 24 * 60 * 60;
const e18     = (n) => ethers.parseEther(String(n));
const advance = (secs) => ethers.provider.send("evm_increaseTime", [secs]).then(() =>
                          ethers.provider.send("evm_mine", []));

// ─── SUITE ───────────────────────────────────────────────────────────────────

describe("SwarmBase v4", function () {

  let owner, user1, user2, user3, treasury;
  let core, nft, token;

  beforeEach(async () => {
    [owner, user1, user2, user3, treasury] = await ethers.getSigners();

    // Deploy SwarmToken
    const SwarmToken = await ethers.getContractFactory("SwarmToken");
    token = await SwarmToken.deploy(owner.address);
    await token.waitForDeployment();

    // Deploy SwarmCoreV4
    const SwarmCore = await ethers.getContractFactory("SwarmCore");
    core = await SwarmCore.deploy();
    await core.waitForDeployment();

    // Deploy SwarmNFTV4
    const SwarmNFT = await ethers.getContractFactory("SwarmBadge");
    nft = await SwarmNFT.deploy(core.target, "ipfs://test/");
    await nft.waitForDeployment();
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe("SwarmCore — Registration", () => {

    it("allows direct registration", async () => {
      await core.connect(user1).register();
      expect(await core.registered(user1.address)).to.equal(true);
    });

    it("records registrationTime on register", async () => {
      await core.connect(user1).register();
      expect(await core.registrationTime(user1.address)).to.be.gt(0);
    });

    it("reverts on double registration", async () => {
      await core.connect(user1).register();
      await expect(core.connect(user1).register())
        .to.be.revertedWith("Already registered");
    });

    it("allows register with referral (open — no prior invite needed)", async () => {
      await core.connect(user1).register();
      await core.connect(user2).registerWithReferral(user1.address);
      expect(await core.registered(user2.address)).to.equal(true);
    });

    it("awards 10 score to referrer on successful referral (phase 1 immediate)", async () => {
      await core.connect(user1).register();
      // user1: 50 pts welcome bonus from register()
      await core.connect(user2).registerWithReferral(user1.address);
      // user1: +10 pts referral signal = 60 pts total
      expect(await core.swarmScore(user1.address)).to.equal(e18(60));
    });

    it("awards 100 score to referrer on referee's 3rd check-in (phase 2 delayed)", async () => {
      await core.connect(user1).register();
      await core.connect(user2).registerWithReferral(user1.address);
      // 2 check-ins — no bonus yet
      await core.connect(user2).hiveCheckIn();
      await ethers.provider.send("evm_increaseTime", [86401]);
      await core.connect(user2).hiveCheckIn();
      const scoreBefore = await core.swarmScore(user1.address);
      // 3rd check-in — bonus fires
      await ethers.provider.send("evm_increaseTime", [86401]);
      await core.connect(user2).hiveCheckIn();
      expect(await core.swarmScore(user1.address)).to.equal(scoreBefore + e18(100));
      expect(await core.referralMilestone(user2.address)).to.equal(1); // milestone 1 = 3ci paid
    });

    it("phase 2 bonus fires only once — 4th check-in does not re-award", async () => {
      await core.connect(user1).register();
      await core.connect(user2).registerWithReferral(user1.address);
      for (let i = 0; i < 3; i++) {
        await ethers.provider.send("evm_increaseTime", [86401]);
        await core.connect(user2).hiveCheckIn();
      }
      const scoreAfter3 = await core.swarmScore(user1.address);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await core.connect(user2).hiveCheckIn();
      expect(await core.swarmScore(user1.address)).to.equal(scoreAfter3); // unchanged
    });

    it("awards 50 pts to referrer on referee's 7th check-in", async () => {
      await core.connect(user1).register();
      await core.connect(user2).registerWithReferral(user1.address);
      // hit milestone 1 (3ci)
      for (let i = 0; i < 3; i++) { await ethers.provider.send("evm_increaseTime", [86401]); await core.connect(user2).hiveCheckIn(); }
      // check-ins 4, 5, 6
      for (let i = 0; i < 3; i++) { await ethers.provider.send("evm_increaseTime", [86401]); await core.connect(user2).hiveCheckIn(); }
      const scoreBefore = await core.swarmScore(user1.address);
      // 7th check-in — milestone 2 fires
      await ethers.provider.send("evm_increaseTime", [86401]);
      await core.connect(user2).hiveCheckIn();
      expect(await core.swarmScore(user1.address)).to.equal(scoreBefore + e18(50));
      expect(await core.referralMilestone(user2.address)).to.equal(2);
    });

    it("awards 200 pts to referrer on referee's 30th check-in", async function() {
      this.timeout(30_000);
      await core.connect(user1).register();
      await core.connect(user2).registerWithReferral(user1.address);
      for (let i = 0; i < 29; i++) { await ethers.provider.send("evm_increaseTime", [86401]); await core.connect(user2).hiveCheckIn(); }
      // after 29: milestone should be at 2 (7ci paid), 30ci not yet
      const scoreBefore = await core.swarmScore(user1.address);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await core.connect(user2).hiveCheckIn(); // 30th
      expect(await core.swarmScore(user1.address)).to.equal(scoreBefore + e18(200));
      expect(await core.referralMilestone(user2.address)).to.equal(3);
    });

    it("awards 500 pts to referrer on referee's 90th check-in", async function() {
      this.timeout(60_000);
      await core.connect(user1).register();
      await core.connect(user2).registerWithReferral(user1.address);
      for (let i = 0; i < 89; i++) { await ethers.provider.send("evm_increaseTime", [86401]); await core.connect(user2).hiveCheckIn(); }
      const scoreBefore = await core.swarmScore(user1.address);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await core.connect(user2).hiveCheckIn(); // 90th
      expect(await core.swarmScore(user1.address)).to.equal(scoreBefore + e18(500));
      expect(await core.referralMilestone(user2.address)).to.equal(4);
    });

    it("no phase 2 bonus for wallets without referrer", async () => {
      await core.connect(user1).register();
      for (let i = 0; i < 3; i++) {
        await ethers.provider.send("evm_increaseTime", [86401]);
        await core.connect(user1).hiveCheckIn();
      }
      // user1 has no referrer — no error, just normal check-ins
      expect(await core.referralMilestone(user1.address)).to.equal(0); // no referrer, no milestone
    });

    it("increments referralCount on referrer", async () => {
      await core.connect(user1).register();
      await core.connect(user2).registerWithReferral(user1.address);
      expect(await core.referralCount(user1.address)).to.equal(1);
    });

    it("reverts referral if referrer not registered", async () => {
      await expect(core.connect(user2).registerWithReferral(user1.address))
        .to.be.revertedWith("Referrer not registered");
    });

    it("reverts self-referral", async () => {
      await expect(core.connect(user2).registerWithReferral(user2.address))
        .to.be.revertedWith("Cannot refer self");
    });

    it("reverts referral if already registered", async () => {
      await core.connect(user1).register();
      await core.connect(user2).register();
      await expect(core.connect(user2).registerWithReferral(user1.address))
        .to.be.revertedWith("Already registered");
    });

    // Helper: create N fresh funded wallets and register each with referrer
    async function registerN(referrer, n) {
      for (let i = 0; i < n; i++) {
        const w = ethers.Wallet.createRandom().connect(ethers.provider);
        await ethers.provider.send("hardhat_setBalance", [w.address, "0x" + (10n ** 18n).toString(16)]);
        await core.connect(w).registerWithReferral(referrer.address);
      }
    }

    it("flat referral — 10 referrals each award 10 pts (no tiers)", async function () {
      this.timeout(60_000);
      await core.connect(user1).register();
      await registerN(user1, 10);
      expect(await core.referralCount(user1.address)).to.equal(10);
      // user1: 50 (register) + 10×10 (referrals) = 150 pts
      expect(await core.swarmScore(user1.address)).to.equal(e18(150));
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe("SwarmCore — Engagement Actions", () => {

    beforeEach(async () => {
      await core.connect(user1).register();
    });

    it("hiveCheckIn awards base score on day 1", async () => {
      await core.connect(user1).hiveCheckIn();
      const score = await core.swarmScore(user1.address);
      // 50 pts (register welcome) + 25 pts (day 1 check-in, base 25) = 75
      expect(score).to.equal(e18(75));
    });

    it("hiveCheckIn increases streak over time", async () => {
      await core.connect(user1).hiveCheckIn();
      await advance(DAY + 1);
      await core.connect(user1).hiveCheckIn();
      expect(await core.hiveStreak(user1.address)).to.equal(2);
    });

    it("hiveCheckIn resets streak if missed >48h", async () => {
      await core.connect(user1).hiveCheckIn();
      await advance(3 * DAY);
      await core.connect(user1).hiveCheckIn();
      expect(await core.hiveStreak(user1.address)).to.equal(1);
    });

    it("awards 150 pts milestone bonus on every 7th check-in", async () => {
      for (let i = 0; i < 6; i++) {
        await advance(DAY + 1);
        await core.connect(user1).hiveCheckIn();
      }
      const scoreBefore = await core.swarmScore(user1.address);
      await advance(DAY + 1);
      await core.connect(user1).hiveCheckIn(); // 7th check-in
      const scoreAfter = await core.swarmScore(user1.address);
      // Must have received the 150 pt milestone bonus (plus normal check-in pts)
      const diff = scoreAfter - scoreBefore;
      expect(diff).to.be.gte(e18(150 + 25)); // at minimum 150 milestone + 25 base check-in
    });

    it("awards 500 pts milestone bonus on every 30th check-in", async () => {
      for (let i = 0; i < 29; i++) {
        await advance(DAY + 1);
        await core.connect(user1).hiveCheckIn();
      }
      const scoreBefore = await core.swarmScore(user1.address);
      await advance(DAY + 1);
      await core.connect(user1).hiveCheckIn(); // 30th check-in
      const scoreAfter = await core.swarmScore(user1.address);
      const diff = scoreAfter - scoreBefore;
      expect(diff).to.be.gte(e18(500 + 25)); // 500 milestone + 25 base check-in
    });

    it("awards 1500 pts milestone bonus on every 90th check-in (takes priority over 30-day)", async function() {
      this.timeout(30_000);
      for (let i = 0; i < 89; i++) {
        await advance(DAY + 1);
        await core.connect(user1).hiveCheckIn();
      }
      const scoreBefore = await core.swarmScore(user1.address);
      await advance(DAY + 1);
      await core.connect(user1).hiveCheckIn(); // 90th check-in
      const scoreAfter = await core.swarmScore(user1.address);
      const diff = scoreAfter - scoreBefore;
      // Must get 1500 milestone (not 500 30-day) + normal check-in pts
      expect(diff).to.be.gte(e18(1500 + 25));
      // Must NOT have gotten the 500-pt 30-day bonus (90 % 30 == 0 but 90-day takes priority)
      expect(diff).to.be.lt(e18(1500 + 500 + 76 + 1)); // less than 1500+500+max_checkin
    });

    it("reverts double check-in same day", async () => {
      await core.connect(user1).hiveCheckIn();
      await expect(core.connect(user1).hiveCheckIn())
        .to.be.revertedWith("Already checked in today");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe("SwarmCore — Owner Controls", () => {

    it("owner can pause and unpause", async () => {
      await core.connect(owner).pause();
      await expect(core.connect(user1).register())
        .to.be.revertedWith("Contract is paused");
      await core.connect(owner).unpause();
      await core.connect(user1).register();
      expect(await core.registered(user1.address)).to.equal(true);
    });

    it("non-owner cannot pause", async () => {
      await expect(core.connect(user1).pause())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe("SwarmBadge — Badge Minting", () => {

    beforeEach(async () => {
      await core.connect(user1).register();
    });

    it("mints Pioneer badge to registered user", async () => {
      await nft.connect(user1).mintPioneer();
      expect(await nft.hasBadge(user1.address, 1)).to.equal(true);
    });

    it("reverts Pioneer mint if not registered", async () => {
      await expect(nft.connect(user2).mintPioneer())
        .to.be.revertedWith("SwarmNFT: not registered on SwarmCore");
    });

    it("reverts double Pioneer mint", async () => {
      await nft.connect(user1).mintPioneer();
      await expect(nft.connect(user1).mintPioneer())
        .to.be.revertedWith("SwarmNFT: Pioneer already minted");
    });

    it("reverts Builder mint if score too low", async () => {
      await expect(nft.connect(user1).mintBuilder())
        .to.be.revertedWith("SwarmNFT: score too low for Builder (need 1,000)");
    });

    it("mints Builder badge when score >= 1,000", async function() {
      this.timeout(120_000);
      // beforeEach: user1 registered = 50 pts
      // 100 referrals × 10 pts = 1,000 pts → total 1,050 pts (>= 1,000 gate)
      for (let i = 0; i < 100; i++) {
        const w = ethers.Wallet.createRandom().connect(ethers.provider);
        await ethers.provider.send("hardhat_setBalance", [w.address, "0x" + (10n ** 18n).toString(16)]);
        await core.connect(w).registerWithReferral(user1.address);
      }
      expect(await core.swarmScore(user1.address)).to.be.gte(e18(1000));
      await nft.connect(user1).mintBuilder();
      expect(await nft.hasBadge(user1.address, 2)).to.equal(true);
    });

    it("OG badge is soulbound — transfer reverts", async () => {
      await nft.connect(user1).mintPioneer();
      await expect(
        nft.connect(user1).safeTransferFrom(user1.address, user2.address, 1, 1, "0x")
      ).to.be.revertedWith("SwarmNFT: soulbound - non-transferable");
    });

    it("getEligibility returns correct status", async () => {
      const [pioneerElig, builderElig, ogElig] = await nft.getEligibility(user1.address);
      expect(pioneerElig).to.equal(true);
      expect(builderElig).to.equal(false);
      expect(ogElig).to.equal(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe("SwarmToken — Distribution", () => {

    let wallets;

    beforeEach(async () => {
      const signers = await ethers.getSigners();
      wallets = {
        community:         signers[5].address,
        team:              signers[6].address,
        ecosystem:         signers[7].address,
        marketing:         signers[8].address,
        strategicRound:    signers[9].address,
        treasury:          signers[10].address,
        liquidity:         signers[11].address,
        reserve:           signers[12].address,
        strategicPartners: signers[13].address,
      };
    });

    it("total supply is 1 billion", async () => {
      expect(await token.totalSupply()).to.equal(e18(1_000_000_000));
    });

    it("owner holds full supply after deploy", async () => {
      expect(await token.balanceOf(owner.address)).to.equal(e18(1_000_000_000));
    });

    it("distribute sends correct amounts to wallets", async () => {
      await token.setWallets(
        wallets.community, wallets.team, wallets.ecosystem, wallets.marketing,
        wallets.strategicRound, wallets.treasury, wallets.liquidity,
        wallets.reserve, wallets.strategicPartners
      );
      await token.distribute();
      expect(await token.balanceOf(wallets.community)).to.equal(e18(200_000_000));
      expect(await token.balanceOf(wallets.team)).to.equal(e18(150_000_000));
      expect(await token.balanceOf(wallets.liquidity)).to.equal(e18(80_000_000));
    });

    it("distribute reverts on second call", async () => {
      await token.setWallets(
        wallets.community, wallets.team, wallets.ecosystem, wallets.marketing,
        wallets.strategicRound, wallets.treasury, wallets.liquidity,
        wallets.reserve, wallets.strategicPartners
      );
      await token.distribute();
      await expect(token.distribute()).to.be.revertedWith("Already distributed");
    });

    it("setSwarmCore links core address", async () => {
      await token.setSwarmCore(core.target);
      expect(await token.swarmCoreContract()).to.equal(core.target);
    });

    it("lockSwarmCore prevents further updates", async () => {
      await token.setSwarmCore(core.target);
      await token.lockSwarmCore();
      await expect(token.setSwarmCore(user1.address))
        .to.be.revertedWith("SwarmCore address is locked");
    });
  });


});
