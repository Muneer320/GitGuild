# GitGuild web app

Start the local chain and deploy both contracts using [SETUP.md](../SETUP.md), then run `npm run dev` from the repository root. Open http://localhost:3000 and connect a wallet on chain ID 31337 with Hardhat test ETH.

The dashboard reads on-chain token and market records. It does not require a GitHub token or display invented trading metrics. The market owner creates and resolves PR outcome markets; GitGuild does not verify PR results. Run `npm run build --workspace frontend` for a production and TypeScript build.
