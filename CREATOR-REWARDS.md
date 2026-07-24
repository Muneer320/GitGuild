# Creator payments

When the factory registers a repository token, the transaction sender becomes that token's `projectCreator`. The factory does not check whether that wallet owns the GitHub repository.

On each successful mint, `ProjectCoin` sends 10% of the required mint payment to `projectCreator`. It sends 30% to the treasury address and 40% to the reward pool address. The remaining 20% stays in the token contract. Overpayment is refunded and does not increase these fees.

The reward pool address receives ETH directly. There is no automatic payment from that address to token holders, no automated token buyback, and no merge-triggered reward. The token owner can change treasury and reward pool addresses and withdraw the token contract's remaining ETH. See [README.md](README.md) for the full local demo and trust limits.
