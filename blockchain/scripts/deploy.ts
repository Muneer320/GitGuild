import hre from "hardhat";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const factory = await hre.viem.deployContract("ProjectCoinFactory", [
    deployer.account.address,
    deployer.account.address,
    deployer.account.address,
  ]);
  const market = await hre.viem.deployContract("PredictionMarket", [deployer.account.address]);

  console.log("Network:", hre.network.name);
  console.log("Factory:", factory.address);
  console.log("PredictionMarket:", market.address);
  console.log("Owner:", deployer.account.address);

  if (hre.network.name === "localhost") {
    const envPath = resolve(__dirname, "../../frontend/.env.local");
    writeFileSync(envPath,
      "NEXT_PUBLIC_FACTORY_ADDRESS=" + factory.address + "\n" +
      "NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=" + market.address + "\n",
      { encoding: "utf8", mode: 0o600 });
    console.log("Wrote", envPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
