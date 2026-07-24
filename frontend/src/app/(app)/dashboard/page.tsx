"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TokenTrading from "@/components/token-trading";
import PredictionMarket from "@/components/prediction-market";
import { predictionMarketAbi, projectCoinFactoryAbi } from "@/lib/wagmi-generated";

const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
const marketAddress = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as `0x${string}`;

export default function DashboardPage() {
  const { address, chain, isConnected } = useAccount();
  const { data: balance } = useBalance({ address, query: { enabled: Boolean(address) } });
  const { data: tokenCount } = useReadContract({
    address: factoryAddress,
    abi: projectCoinFactoryAbi,
    functionName: "getTotalTokensCount",
    query: { enabled: Boolean(factoryAddress) },
  });
  const { data: activeMarketIds } = useReadContract({
    address: marketAddress,
    abi: predictionMarketAbi,
    functionName: "getActiveMarkets",
    query: { enabled: Boolean(marketAddress) },
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">GitGuild dashboard</h1>
        <p className="mt-2 text-muted-foreground">Repository tokens and PR prediction markets are separate contracts. Use a local Hardhat chain and test ETH for the demo.</p>
      </div>
      {(!factoryAddress || !marketAddress) && (
        <Card><CardContent className="pt-6">Contract addresses are not configured. Run the local deployment and copy its addresses to frontend/.env.local, then restart the app.</CardContent></Card>
      )}
      {isConnected && chain?.id !== 31337 && (
        <Card><CardContent className="pt-6">Switch your wallet to the local Hardhat network (chain ID 31337) to use the local demo contracts.</CardContent></Card>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">Wallet</CardTitle></CardHeader><CardContent>{isConnected ? (balance ? formatEther(balance.value) + " ETH" : "Loading balance") : "Connect wallet"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Registered repositories</CardTitle></CardHeader><CardContent>{tokenCount === undefined ? "—" : tokenCount.toString()}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Active PR markets</CardTitle></CardHeader><CardContent>{activeMarketIds ? activeMarketIds.length : "—"}</CardContent></Card>
      </div>
      <Tabs defaultValue="tokens" className="space-y-4">
        <TabsList><TabsTrigger value="tokens">Repository tokens</TabsTrigger><TabsTrigger value="markets">PR markets</TabsTrigger></TabsList>
        <TabsContent value="tokens"><TokenTrading /></TabsContent>
        <TabsContent value="markets"><PredictionMarket /></TabsContent>
      </Tabs>
    </div>
  );
}
