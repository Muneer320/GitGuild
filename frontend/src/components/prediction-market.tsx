"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConfig } from "wagmi";
import { parseEther, formatEther, Address, keccak256, toHex } from "viem";
import { readContract } from '@wagmi/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { predictionMarketAbi } from "@/lib/wagmi-generated";

// Get the deployed PredictionMarket contract address from environment
const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address;

// Utility function to extract repository and PR number from description
function extractRepoAndPR(description: string): { repository: string; prNumber: number } | null {
  // Match patterns like "Will PR #123 in repo owner/name be merged?" 
  // or "Will owner/repo PR #456 be merged?"
  const patterns = [
    /(?:PR #(\d+) in (?:repo )?([^?\s]+))/i,
    /(?:([^?\s]+) PR #(\d+))/i,
    /(?:([^?\s]+)\/[^?\s]+ #(\d+))/i
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        // Pattern: "PR #123 in repo owner/name"
        return { prNumber: parseInt(match[1]), repository: match[2] };
      } else {
        // Pattern: "owner/repo PR #123" or "owner/repo #123"
        return { repository: match[1], prNumber: parseInt(match[2]) };
      }
    }
  }
  
  return null;
}

interface Market {
  id: string;
  repository: string;
  prNumber: number;
  description: string;
  yesPool: bigint;
  noPool: bigint;
  totalYesTokens: bigint;
  totalNoTokens: bigint;
  resolved: boolean;
  outcome: boolean;
  createdAt: number;
  resolvedAt: number;
}

interface UserPosition {
  marketId: string;
  repository: string;
  prNumber: number;
  yesTokens: bigint;
  noTokens: bigint;
  hasClaimed: boolean;
}

export default function PredictionMarket() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [betAmount, setBetAmount] = useState("");
  const validBet = /^\d+(\.\d{1,18})?$/.test(betAmount) && Number(betAmount) > 0;
  const [betType, setBetType] = useState<"yes" | "no">("yes");
  const [newMarketDescription, setNewMarketDescription] = useState("");

  // Contract write hooks
  const { writeContract: createMarket, data: createMarketHash } = useWriteContract();
  const { writeContract: takePosition, data: takePositionHash } = useWriteContract();
  const { writeContract: resolveMarket, data: resolveMarketHash } = useWriteContract();
  const { writeContract: claimWinnings, data: claimWinningsHash } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isCreateMarketLoading, isSuccess: created } = useWaitForTransactionReceipt({ hash: createMarketHash });
  const { isLoading: isTakePositionLoading, isSuccess: positioned } = useWaitForTransactionReceipt({ hash: takePositionHash });
  const { isLoading: isResolveMarketLoading, isSuccess: resolved } = useWaitForTransactionReceipt({ hash: resolveMarketHash });
  const { isLoading: isClaimWinningsLoading, isSuccess: claimed } = useWaitForTransactionReceipt({ hash: claimWinningsHash });
  const { data: marketOwner } = useReadContract({ address: PREDICTION_MARKET_ADDRESS, abi: predictionMarketAbi, functionName: "owner", query: { enabled: Boolean(PREDICTION_MARKET_ADDRESS) } });
  const isOwner = address?.toLowerCase() === marketOwner?.toLowerCase();

  // Read contract data
  const { data: allMarketsData, refetch: refetchMarkets } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: predictionMarketAbi,
    functionName: "getAllMarkets",
    query: { enabled: Boolean(PREDICTION_MARKET_ADDRESS) },
  });

  useEffect(() => {
    if (created || positioned || resolved || claimed) {
      refetchMarkets();
    }
  }, [created, positioned, resolved, claimed, refetchMarkets]);

  // Load markets and user positions
  useEffect(() => {
    if (!allMarketsData) return;

    const loadMarkets = async () => {
      if (Array.isArray(allMarketsData)) {
        const marketPromises = allMarketsData.map(async (marketId) => {
          const data = await readContract(config, {
            address: PREDICTION_MARKET_ADDRESS,
            abi: predictionMarketAbi,
            functionName: "markets",
            args: [marketId],
          });
          const prNumber = Number(data[0]);
          const repository = data[1];
          return {
            id: marketId,
            repository,
            prNumber,
            description: `Will PR #${prNumber} in ${repository} be merged?`,
            yesPool: data[3],
            noPool: data[4],
            totalYesTokens: data[5],
            totalNoTokens: data[6],
            resolved: data[7],
            outcome: data[8],
            resolvedAt: Number(data[9]),
            createdAt: Number(data[10]),
          };
        });
        
        const loadedMarkets = (await Promise.all(marketPromises)).filter(Boolean) as Market[];
        setMarkets(loadedMarkets);
        
        // Load user positions for each market
        if (address && loadedMarkets.length > 0) {
          const positionPromises = loadedMarkets.map(async (market) => {
            try {
              const positionData = await readContract(config, {
                address: PREDICTION_MARKET_ADDRESS,
                abi: predictionMarketAbi,
                functionName: "getUserPositions",
                args: [market.repository, BigInt(market.prNumber), address],
              });
              
              return {
                marketId: market.id,
                repository: market.repository,
                prNumber: market.prNumber,
                yesTokens: positionData[0] as bigint,
                noTokens: positionData[1] as bigint,
                hasClaimed: positionData[2] as boolean,
              };
            } catch (error) {
              return null;
            }
          });
          
          const loadedPositions = (await Promise.all(positionPromises)).filter(Boolean) as UserPosition[];
          setUserPositions(loadedPositions);
        }
      }
    };

    loadMarkets();
  }, [allMarketsData, address, config, created, positioned, resolved, claimed]);

  const handleCreateMarket = () => {
    if (!newMarketDescription.trim()) return;

    const repoAndPR = extractRepoAndPR(newMarketDescription);
    if (!repoAndPR) {
      alert("Please include repository and PR number in format: 'Will PR #123 in owner/repo be merged?' or 'Will owner/repo PR #123 be merged?'");
      return;
    }

    createMarket({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "createMarket",
      args: [repoAndPR.repository, BigInt(repoAndPR.prNumber)],
    });

    setNewMarketDescription("");
  };

  const handleTakePosition = () => {
    if (!selectedMarket || !validBet) return;

    const market = markets.find(m => m.id === selectedMarket);
    if (!market) return;

    const amount = parseEther(betAmount);
    
    if (betType === "yes") {
      takePosition({
        address: PREDICTION_MARKET_ADDRESS,
        abi: predictionMarketAbi,
        functionName: "takeYesPosition",
        args: [market.repository, BigInt(market.prNumber)],
        value: amount,
      });
    } else {
      takePosition({
        address: PREDICTION_MARKET_ADDRESS,
        abi: predictionMarketAbi,
        functionName: "takeNoPosition",
        args: [market.repository, BigInt(market.prNumber)],
        value: amount,
      });
    }

    setBetAmount("");
  };

  const handleResolveMarket = (marketId: string, outcome: boolean) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    resolveMarket({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "resolveMarket",
      args: [market.repository, BigInt(market.prNumber), outcome],
    });
  };

  const handleClaimWinnings = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;

    claimWinnings({
      address: PREDICTION_MARKET_ADDRESS,
      abi: predictionMarketAbi,
      functionName: "claimWinnings",
      args: [market.repository, BigInt(market.prNumber)],
    });
  };

  if (!PREDICTION_MARKET_ADDRESS) {
    return <Card><CardContent className="pt-6">Prediction market contract address is not configured.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {!isConnected && <Alert><AlertDescription>Connect a wallet to place positions or claim payouts. Markets are visible without a wallet.</AlertDescription></Alert>}
      {/* Only the deployed contract owner can create markets. */}
      {isOwner && <Card>
        <CardHeader>
          <CardTitle>Create Prediction Market</CardTitle>
          <CardDescription>Create a new YES/NO prediction market for GitHub PR outcomes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Market Description</Label>
            <Input
              id="description"
              placeholder="Will PR #123 in owner/repo be merged?"
              value={newMarketDescription}
              onChange={(e) => setNewMarketDescription(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateMarket}
            disabled={!newMarketDescription.trim() || isCreateMarketLoading}
            className="w-full"
          >
            {isCreateMarketLoading ? "Creating..." : "Create Market"}
          </Button>
        </CardContent>
      </Card>}

      {/* Active Markets */}
      <Card>
        <CardHeader>
          <CardTitle>Active Prediction Markets</CardTitle>
          <CardDescription>Winning positions share both pools after a 5% fee on each stake. The contract owner reports the outcome.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {markets.map((market) => {
            const userPosition = userPositions.find(p => p.marketId === market.id);
            
            return (
              <div key={market.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{market.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(market.createdAt * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={market.resolved ? "secondary" : "default"}>
                    {market.resolved ? "Resolved" : "Active"}
                  </Badge>
                </div>

                {/* User Position Display */}
                {userPosition && (userPosition.yesTokens > 0n || userPosition.noTokens > 0n) && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h4 className="text-sm font-medium mb-2">Your Position:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {userPosition.yesTokens > 0n && (
                        <div className="text-emerald-600 dark:text-emerald-400">
                          YES: {userPosition.yesTokens.toString()} tokens
                        </div>
                      )}
                      {userPosition.noTokens > 0n && (
                        <div className="text-rose-600 dark:text-rose-400">
                          NO: {userPosition.noTokens.toString()} tokens
                        </div>
                      )}
                    </div>
                    {market.resolved && !userPosition.hasClaimed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Claim is available for winning positions, or as a refund when no one backed the winning outcome.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">YES Pool</span>
                      <span className="text-sm">{formatEther(market.yesPool)} ETH</span>
                    </div>
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 h-2 rounded">
                      <div 
                        className="bg-emerald-600 dark:bg-emerald-400 h-2 rounded"
                        style={{
                          width: `${Number(market.yesPool + market.noPool) ? Number(market.yesPool) / Number(market.yesPool + market.noPool) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-rose-600 dark:text-rose-400">NO Pool</span>
                      <span className="text-sm">{formatEther(market.noPool)} ETH</span>
                    </div>
                    <div className="bg-rose-100 dark:bg-rose-900/30 h-2 rounded">
                      <div 
                        className="bg-rose-600 dark:bg-rose-400 h-2 rounded"
                        style={{
                          width: `${Number(market.yesPool + market.noPool) ? Number(market.noPool) / Number(market.yesPool + market.noPool) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {!market.resolved && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`amount-${market.id}`}>Bet Amount (ETH)</Label>
                          <Input
                            id={`amount-${market.id}`}
                            placeholder="0.1"
                            value={selectedMarket === market.id ? betAmount : ""}
                            onChange={(e) => {
                              setSelectedMarket(market.id);
                              setBetAmount(e.target.value);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={betType === "yes" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setBetType("yes")}
                              className="flex-1"
                            >
                              YES
                            </Button>
                            <Button
                              variant={betType === "no" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setBetType("no")}
                              className="flex-1"
                            >
                              NO
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={handleTakePosition}
                          disabled={!isConnected || !validBet || selectedMarket !== market.id || isTakePositionLoading}
                          className="flex-1"
                        >
                          {isTakePositionLoading ? "Betting..." : `Bet ${betType.toUpperCase()}`}
                        </Button>
                        {isOwner && <Button
                          variant="outline"
                          onClick={() => handleResolveMarket(market.id, true)}
                          disabled={isResolveMarketLoading}
                          size="sm"
                        >
                          Resolve YES
                        </Button>}
                        {isOwner && <Button
                          variant="outline"
                          onClick={() => handleResolveMarket(market.id, false)}
                          disabled={isResolveMarketLoading}
                          size="sm"
                        >
                          Resolve NO
                        </Button>}
                      </div>
                    </div>
                  </>
                )}

                {market.resolved && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Outcome:</span>
                      <Badge variant={market.outcome ? "default" : "destructive"}>
                        {market.outcome ? "YES - owner reported merged" : "NO - owner reported closed"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Resolved: {new Date(market.resolvedAt * 1000).toLocaleDateString()}
                    </div>
                    {userPosition && !userPosition.hasClaimed &&
                      ((market.outcome && userPosition.yesTokens > 0n) ||
                       (!market.outcome && userPosition.noTokens > 0n) ||
                       (market.outcome && market.totalYesTokens === 0n && userPosition.noTokens > 0n) ||
                       (!market.outcome && market.totalNoTokens === 0n && userPosition.yesTokens > 0n)) && (
                      <Button
                        onClick={() => handleClaimWinnings(market.id)}
                        disabled={isClaimWinningsLoading}
                        variant="outline"
                        size="sm"
                      >
                        {isClaimWinningsLoading ? "Claiming..." : "Claim Winnings"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {markets.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Prediction Markets Available</h3>
              <p className="text-muted-foreground mb-4">
                Create your first prediction market above or wait for others to create markets.
              </p>
              <p className="text-sm text-muted-foreground">
                Markets will appear here once they're created on the blockchain.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
