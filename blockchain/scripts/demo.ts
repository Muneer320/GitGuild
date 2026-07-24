import hre from "hardhat";
import { formatEther, parseEther } from "viem";

async function main() {
  const [owner, yes, no] = await hre.viem.getWalletClients();
  const client = await hre.viem.getPublicClient();
  const factory = await hre.viem.deployContract("ProjectCoinFactory", [
    owner.account.address, owner.account.address, owner.account.address,
  ]);
  const market = await hre.viem.deployContract("PredictionMarket", [owner.account.address]);

  const fee = await factory.read.creationFee();
  await factory.write.createProjectCoin(
    ["Example Repository", "EXR", "example", "repo", owner.account.address, owner.account.address],
    { account: owner.account, value: fee },
  );
  const tokenAddress = await factory.read.getTokenByRepo(["example", "repo"]);
  const token = await hre.viem.getContractAt("ProjectCoin", tokenAddress);
  const amount = parseEther("1000");
  const cost = await token.read.calculateMintCost([amount]);
  await token.write.mintTokens([amount], { account: yes.account, value: cost });
  if (await token.read.balanceOf([yes.account.address]) !== amount) {
    throw new Error("Token mint failed");
  }

  await market.write.createMarket(["example/repo", 42n], { account: owner.account });
  await market.write.takeYesPosition(["example/repo", 42n], { account: yes.account, value: parseEther("1") });
  await market.write.takeNoPosition(["example/repo", 42n], { account: no.account, value: parseEther("1") });
  await market.write.resolveMarket(["example/repo", 42n, true], { account: owner.account });
  await market.write.claimWinnings(["example/repo", 42n], { account: yes.account });
  const remaining = await client.getBalance({ address: market.address });
  if (remaining !== 0n) throw new Error("Market payout failed");

  console.log("GitGuild local demo passed");
  console.log("Repository token:", tokenAddress);
  console.log("Minted:", formatEther(amount), "EXR for", formatEther(cost), "ETH");
  console.log("Prediction market: example/repo PR #42, YES won");
  console.log("YES payout:", formatEther(parseEther("1.9")), "ETH after 5% fee on each stake");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
