# GitGuild

**Decentralized prediction markets for GitHub pull requests. Built on BlockTrain — India's first moving Ethereum hackathon (3rd place).**

GitGuild (originally BlockSmiths) lets you create and trade prediction markets for any GitHub repo's pull requests using bonding curve economics — Web2 meets Web3.

Built on a moving train from Bangalore to Delhi. 36 hours. Limited internet. 45 builders. 21 projects shipped. GitGuild placed 3rd.

*Organized by Devfolio. Sponsored by Base, Noice, Geode.*

---

## The Problem

Open source development lacks market signals for PR quality and merge probability. Contributors waste time on PRs unlikely to merge. Maintainers can't prioritize effectively.

## How It Works

- Anyone creates a `ProjectCoin` for any GitHub repo via the factory contract
- Tokens represent prediction markets for that repo's PRs
- Bonding curve pricing: early buyers get tokens cheaper, later buyers pay more
- PR merged → reward pool pays out to token holders
- PR rejected → buyback and burn creates deflationary pressure

## Tech Stack

- **Smart Contracts:** Solidity 0.8.28, Hardhat, OpenZeppelin, Sepolia testnet
- **Frontend:** Next.js 14, TypeScript, Wagmi + Viem, Tailwind CSS
- **Integration:** GitHub REST API, MetaMask

## Project Structure

```
GitGuild/
├── blockchain/          # Smart contracts & deployment
│   ├── contracts/       # ProjectCoinFactory.sol, ProjectCoin.sol
│   ├── test/            # Contract tests
│   └── scripts/         # Deployment scripts
├── frontend/            # Next.js application
└── README.md
```

## Quick Start

```bash
git clone https://github.com/Muneer320/GitGuild.git
cd GitGuild
npm install
cd blockchain && npm install
cd ../frontend && npm install
```

## BlockTrain Context

GitGuild was built at [BlockTrain](https://blocktrain.devfolio.co) — India's first moving Ethereum hackathon organized by Devfolio. A 36-hour train ride from Bengaluru to New Delhi, 5,000+ applicants, 45 builders selected. Built with limited internet using an onboard intranet and local npm packages.

**Result:** 3rd place out of 21 shipped projects.

---

*Built by Muneer Alam. MIT License.*