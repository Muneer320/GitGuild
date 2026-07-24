import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("PredictionMarket", function () {
  async function fixture() {
    const [owner, yes, no] = await hre.viem.getWalletClients();
    const market = await hre.viem.deployContract("PredictionMarket", [owner.account.address]);
    const client = await hre.viem.getPublicClient();
    await market.write.createMarket(["example/repo", 42n], { account: owner.account });
    return { owner, yes, no, market, client };
  }

  it("enumerates markets and pays the winning side", async function () {
    const { owner, yes, no, market, client } = await loadFixture(fixture);
    const id = await market.read.getMarketId(["example/repo", 42n]);
    expect(await market.read.getAllMarkets()).to.deep.equal([id]);
    expect((await market.read.markets([id]))[1]).to.equal("example/repo");
    await market.write.takeYesPosition(["example/repo", 42n], { account: yes.account, value: parseEther("1") });
    await market.write.takeNoPosition(["example/repo", 42n], { account: no.account, value: parseEther("1") });
    await market.write.resolveMarket(["example/repo", 42n, true], { account: owner.account });
    expect(await market.read.getActiveMarkets()).to.deep.equal([]);
    const before = await client.getBalance({ address: market.address });
    await market.write.claimWinnings(["example/repo", 42n], { account: yes.account });
    expect(before - await client.getBalance({ address: market.address })).to.equal(parseEther("1.9"));
    await expect(market.write.claimWinnings(["example/repo", 42n], { account: no.account })).to.be.rejectedWith("No winnings to claim");
  });

  it("returns net stakes if the winning outcome has no backers", async function () {
    const { owner, no, market, client } = await loadFixture(fixture);
    await market.write.takeNoPosition(["example/repo", 42n], { account: no.account, value: parseEther("1") });
    await market.write.resolveMarket(["example/repo", 42n, true], { account: owner.account });
    await market.write.claimWinnings(["example/repo", 42n], { account: no.account });
    expect(await client.getBalance({ address: market.address })).to.equal(0n);
    await expect(market.write.claimWinnings(["example/repo", 42n], { account: no.account })).to.be.rejectedWith("Already claimed");
  });

  it("restricts creation and resolution to the owner", async function () {
    const { yes, market } = await loadFixture(fixture);
    await expect(market.write.createMarket(["example/repo", 43n], { account: yes.account })).to.be.rejectedWith("OwnableUnauthorizedAccount");
    await expect(market.write.resolveMarket(["example/repo", 42n, true], { account: yes.account })).to.be.rejectedWith("OwnableUnauthorizedAccount");
  });
});
