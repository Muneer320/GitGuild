"use client";

import Link from "next/link";
import { useAccount, useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { useProjectCoinFactory } from "@/hooks/web3/useProjectCoin";
import { projectCoinAbi } from "@/lib/wagmi-generated";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortfolioPage() {
  const { address } = useAccount();
  const { allProjects, contractError } = useProjectCoinFactory();
  const projects = allProjects || [];
  const { data: balances, isLoading } = useReadContracts({
    contracts: projects.map((project) => ({
      address: project.tokenAddress as `0x${string}`,
      abi: projectCoinAbi,
      functionName: "balanceOf" as const,
      args: [address || "0x0000000000000000000000000000000000000000"] as const,
    })),
    query: { enabled: Boolean(address) && projects.length > 0 },
  });
  const holdings = projects.map((project, index) => ({
    project,
    balance: balances?.[index]?.status === "success" ? balances[index].result as bigint : 0n,
  })).filter((item) => item.balance > 0n);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Your repository tokens</h1>
        <p className="mt-2 text-muted-foreground">Balances come from the token contracts on your selected chain. This page does not estimate a market price or PR merge reward.</p>
      </div>
      {!address && <Card><CardContent className="pt-6">Connect a wallet to see its token balances.</CardContent></Card>}
      {contractError && <p className="text-sm text-destructive">{contractError}</p>}
      {address && isLoading && <p>Loading token balances…</p>}
      {address && !isLoading && holdings.length === 0 && <Card><CardContent className="pt-6">No repository token holdings found on this chain. <Link href="/dashboard" className="underline">Open the dashboard</Link> to register or mint a token.</CardContent></Card>}
      {holdings.map(({ project, balance }) => (
        <Card key={project.tokenAddress}>
          <CardHeader><CardTitle>{project.name} ({project.symbol})</CardTitle></CardHeader>
          <CardContent>
            <p>{formatEther(balance)} tokens</p>
            <p className="mt-1 text-sm text-muted-foreground">{project.githubOwner}/{project.githubRepo} · {project.tokenAddress}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
