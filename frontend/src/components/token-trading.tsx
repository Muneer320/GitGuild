"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { useProjectCoinFactory, type ProjectInfo } from "@/hooks/web3/useProjectCoin";
import { projectCoinAbi } from "@/lib/wagmi-generated";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function TokenPanel({ project }: { project: ProjectInfo }) {
  const { address } = useAccount();
  const tokenAddress = project.tokenAddress as `0x${string}`;
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"mint" | "redeem">("mint");
  const validAmount = /^\d+(\.\d{1,18})?$/.test(amount) && Number(amount) > 0;
  const units = validAmount ? parseEther(amount) : 0n;
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress, abi: projectCoinAbi, functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: Boolean(address) },
  });
  const { data: mintPrice, refetch: refetchPrice } = useReadContract({
    address: tokenAddress, abi: projectCoinAbi, functionName: "mintPrice",
  });
  const { data: mintCost } = useReadContract({
    address: tokenAddress, abi: projectCoinAbi, functionName: "calculateMintCost",
    args: [units], query: { enabled: units > 0n && action === "mint" },
  });
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      refetchPrice();
      setAmount("");
    }
  }, [isSuccess, refetchBalance, refetchPrice]);

  const submit = () => {
    if (!address || units === 0n) return;
    if (action === "mint") {
      if (mintCost === undefined) return;
      writeContract({ address: tokenAddress, abi: projectCoinAbi, functionName: "mintTokens", args: [units], value: mintCost });
    } else if (tokenBalance !== undefined && tokenBalance >= units) {
      writeContract({ address: tokenAddress, abi: projectCoinAbi, functionName: "redeem", args: [units] });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>{project.name} ({project.symbol})</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{project.githubOwner}/{project.githubRepo} · {tokenAddress}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <p>Your balance: {tokenBalance === undefined ? "—" : formatEther(tokenBalance)} tokens</p>
          <p>Current batch price: {mintPrice === undefined ? "—" : formatEther(mintPrice)} ETH</p>
        </div>
        <div className="flex gap-2">
          <Button variant={action === "mint" ? "default" : "outline"} onClick={() => setAction("mint")}>Mint</Button>
          <Button variant={action === "redeem" ? "default" : "outline"} onClick={() => setAction("redeem")}>Redeem</Button>
        </div>
        <Input aria-label="Token amount" placeholder="Token amount, e.g. 1000" value={amount} onChange={(event) => setAmount(event.target.value)} />
        {action === "mint" && <p className="text-sm">Contract mint cost: {mintCost === undefined ? "—" : formatEther(mintCost)} ETH</p>}
        {action === "redeem" && <p className="text-sm text-muted-foreground">Redemption depends on ETH held by this token contract and may fail if its balance is zero.</p>}
        <Button disabled={!address || !validAmount || isPending || isConfirming || (action === "mint" && mintCost === undefined) || (action === "redeem" && (tokenBalance === undefined || tokenBalance < units))} onClick={submit}>
          {isPending || isConfirming ? "Confirming…" : action === "mint" ? "Mint tokens" : "Redeem tokens"}
        </Button>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {isSuccess && <p className="text-sm text-green-600">Transaction confirmed.</p>}
      </CardContent>
    </Card>
  );
}

export default function TokenTrading() {
  const { isConnected } = useAccount();
  const factory = useProjectCoinFactory();
  const [repository, setRepository] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [selected, setSelected] = useState("");
  const validRepo = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository);
  const projects = factory.allProjects || [];
  const chosen = projects.find((project) => project.tokenAddress === selected);

  const create = () => {
    if (!validRepo || !name.trim() || !symbol.trim()) return;
    factory.createProjectCoin(repository, name.trim(), symbol.trim());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Register a repository token</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Registration is open to any wallet and costs the factory creation fee. The factory does not verify repository ownership.</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Input aria-label="Repository" placeholder="owner/repository" value={repository} onChange={(event) => setRepository(event.target.value)} />
            <Input aria-label="Token name" placeholder="Token name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input aria-label="Token symbol" placeholder="Symbol" value={symbol} onChange={(event) => setSymbol(event.target.value)} />
          </div>
          <Button onClick={create} disabled={!isConnected || !validRepo || !name.trim() || !symbol.trim() || factory.isPending || factory.isConfirming}>Create token</Button>
          {factory.contractError && <p className="text-sm text-destructive">{factory.contractError}</p>}
          {factory.writeError && <p className="text-sm text-destructive">{factory.writeError}</p>}
          {factory.isSuccess && <p className="text-sm text-green-600">Token registered.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Registered repositories</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 && <p className="text-muted-foreground">No repository tokens on this chain yet.</p>}
          {projects.map((project) => (
            <Button key={project.tokenAddress} variant={selected === project.tokenAddress ? "default" : "outline"} onClick={() => setSelected(project.tokenAddress)}>
              {project.githubOwner}/{project.githubRepo}
            </Button>
          ))}
        </CardContent>
      </Card>
      {chosen && <TokenPanel key={chosen.tokenAddress} project={chosen} />}
    </div>
  );
}
