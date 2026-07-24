# Local setup

## Prerequisites

- Node.js 22 and npm
- An injected Ethereum wallet for the browser flow, such as MetaMask
- No GitHub token or live ETH

## Contract demo

From the repository root:

```bash
npm ci
npm test
npm run demo --workspace blockchain
```

The demo uses an in-memory Hardhat chain and exits after checking token minting and a market payout.

## Web app demo

Keep these commands in separate terminals:

```bash
npm run node --workspace blockchain
```

```bash
npm run deploy:local --workspace blockchain
```

```bash
npm run dev
```

The deploy step creates `frontend/.env.local` with the current factory and market addresses. This file is ignored by Git. Open http://localhost:3000 after starting the app.

Add a network to your wallet with RPC URL `http://127.0.0.1:8545`, chain ID `31337`, and currency symbol `ETH`. Import one of the test accounts printed by `hardhat node`. These published development keys are only for local test ETH. Never send real funds to them.

When the local node restarts, it loses deployed contracts. Run the deployment command again, then restart the frontend. If the wallet shows an old nonce, reset its activity for this local network.

The app does not need a GitHub personal access token. It uses contract records and manually entered repository/PR identifiers. No automatic GitHub outcome verification is provided.

## Checks

```bash
npm test
npm run demo --workspace blockchain
npm run build --workspace frontend
```

The frontend build performs TypeScript validation. A production or Sepolia release needs independent contract review, verified deployments, and explicit owner custody decisions.
