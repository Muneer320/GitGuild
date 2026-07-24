# GitGuild

GitGuild is a BlockTrain hackathon prototype for repository tokens and GitHub pull request outcome markets. The contracts and web app can be demonstrated locally with test ETH.

The project has **two separate systems**:

- **ProjectCoinFactory / ProjectCoin:** Anyone can register one ERC-20 token for a repository name. A wallet can mint tokens for ETH and redeem against ETH remaining in the token contract.
- **PredictionMarket:** The contract owner creates a YES/NO market for a repository and PR number. Wallets stake ETH, the owner reports the outcome, and eligible wallets claim a share of the pool.

A repository token is not a token for each PR. A PR merge does not automatically pay token holders. The contracts do not verify GitHub ownership or PR outcomes.

## Run the demo

Use Node.js 22 and npm. From the repository root:

```bash
npm ci
npm test
npm run demo --workspace blockchain
```

The demo deploys both contracts to an in-memory Hardhat chain, registers a repository token, mints it, runs a YES/NO market, resolves it, and checks the payout. It needs no wallet, API key, or real ETH.

To use the web app, keep three terminals open in the repository root:

```bash
# Terminal 1: local blockchain
npm run node --workspace blockchain

# Terminal 2: deploy both contracts to that blockchain
npm run deploy:local --workspace blockchain

# Terminal 3: start the web app
npm run dev
```

The local deployment writes the contract addresses to the ignored file `frontend/.env.local`. Open http://localhost:3000. Connect an injected wallet such as MetaMask to the local network at `http://127.0.0.1:8545`, chain ID `31337`. Import **only a disposable Hardhat test account** from Terminal 1. Hardhat test account keys are public and must never hold real funds. Restart the web app after redeploying because the contract addresses change.

See [SETUP.md](SETUP.md) for the short setup checklist and [USAGE.md](USAGE.md) for the demo flow.

## What the contracts do

| Action | Contract behavior |
| --- | --- |
| Register a repository token | Factory charges 0.01 ETH by default. It does not verify GitHub ownership. |
| Mint tokens | Initial batch price is 0.001 ETH per up to 1,000 tokens. Each batch increases the next price by 0.0001 ETH. |
| Split mint payment | 30% treasury, 40% reward pool address, 10% project creator, 20% stays in the token contract. The retained portion is not an automated buyback. |
| Redeem tokens | Burns tokens for a proportional share of ETH held by the token contract, less a 2% redemption fee. Redemption can fail if the contract has no ETH. |
| Stake on a PR market | 5% of each ETH stake goes to the market owner; 95% enters the YES or NO pool. |
| Resolve a PR market | Only the owner can report the outcome. The contract does not check GitHub. |
| Claim | Winning wallets receive a proportional share of both pools. If nobody backed the winning outcome, wallets on the other side can reclaim their net stakes. |

The `ProjectCoin.resolveMarket` function records an owner supplied PR outcome and multiplier, but does not distribute a payout. The `ProjectCoin.buybackBurn` function can only burn tokens already held by that contract; it does not buy tokens from users.

## Trust and limits

This is a prototype. The contracts have **not been independently audited**. The factory owner can change its creation fee and default addresses. Each token owner can change treasury and reward pool addresses and can withdraw ETH held by the token contract, including ETH that could otherwise back redemptions. The market owner controls creation and resolution, and receives stake fees. A live Sepolia deployment has not been verified against this revision. Use local test ETH for the demo; do not use real funds.

## Project layout

- `blockchain/contracts/`: Solidity contracts.
- `blockchain/test/`: Hardhat tests for registration, minting, fee handling, owner permissions, market positions and claims.
- `blockchain/scripts/demo.ts`: self-contained contract demo.
- `blockchain/scripts/deploy.ts`: local deployment for the web app.
- `frontend/src/`: Next.js 15 app with wagmi 2 and viem 2.

## Team and license

GitGuild grew from the BlockSmiths team project at BlockTrain. The [original team repository](https://github.com/WhyAsh5114/blocksmiths) credits WhyAsh5114 and pradyut-das as contributors; this repository is maintained by Muneer Alam. Historical hackathon material described a third-place result, which is not used as a product performance claim here.

[MIT License](LICENSE) © 2025 Muneer Alam and contributors.
