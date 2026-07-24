# Deployment status

The supported demonstration is the local Hardhat flow in [SETUP.md](SETUP.md). No live Sepolia deployment has been verified against this revision.

Before considering any public testnet deployment:

- Run `npm test`, the local demo, and the frontend build.
- Review both Solidity contracts and their owner permissions. The token owner can withdraw its ETH reserve, and the market owner decides outcomes.
- Decide who controls the market owner and factory owner accounts, and how GitHub PR outcomes will be checked.
- Verify deployed bytecode and contract source against the exact commit used for deployment.
- Set `NEXT_PUBLIC_FACTORY_ADDRESS` and `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS` to those verified addresses for the frontend.
- Keep RPC credentials and any private key out of `NEXT_PUBLIC_*` variables and out of Git.

The existing Sepolia scripts are historical experimental material. Their addresses and bytecode are not an endorsement or a verified release. Do not use real funds with this prototype.
