# Using the local GitGuild demo

Follow [SETUP.md](SETUP.md) to start the local chain, deploy both contracts, start the frontend, and connect a wallet funded with Hardhat test ETH.

## Repository token

1. Open the dashboard and choose **Repository tokens**.
2. Enter a repository in `owner/repo` format, a token name, and a symbol. Click **Create token** and confirm the factory fee in your wallet.
3. Select the registered repository. Enter a token amount and use the contract calculated mint cost to mint.
4. Open **Portfolio** to see the wallet's on-chain token balance.
5. Redeem some tokens from the dashboard if the token contract holds ETH. The amount returned is based on the contract's ETH balance and current token supply, less the redemption fee.

Anyone can register a repository name first; there is no GitHub ownership check. The token is for the repository, not an individual PR. Its reward pool address receives part of mint payments but there is no automatic payment to token holders when a PR merges.

## PR outcome market

1. Open **PR markets**. The contract owner can create a market by entering a repository and PR number in the description field. Other wallets can see markets and place positions.
2. Select a market, enter an ETH amount, choose YES or NO, and confirm the position.
3. The owner resolves the market by selecting the reported outcome. Check the real PR outside GitGuild before resolving; the contract does not check it.
4. A wallet on the winning side can claim its share of the net pool. If nobody backed the reported winning outcome, wallets on the other side can reclaim their net stakes.

Each position pays a 5% fee to the market owner. A claim depends on owner supplied resolution and the contract balance. Use test ETH only.

For a wallet-free walkthrough, run `npm run demo --workspace blockchain` from the repository root.
