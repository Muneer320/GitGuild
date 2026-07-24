# GitGuild contracts

The Solidity contracts are `ProjectCoinFactory`, `ProjectCoin`, and `PredictionMarket`. From the repository root:

```bash
npm ci
npm test
npm run demo --workspace blockchain
```

For a persistent local chain, run `npm run node --workspace blockchain` in one terminal and `npm run deploy:local --workspace blockchain` in another. The deployment writes ignored frontend contract addresses. See the root [README](../README.md) for behavior and trust limits.
