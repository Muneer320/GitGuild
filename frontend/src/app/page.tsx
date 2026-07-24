import Link from "next/link";
import { ArrowRight, Github, GitPullRequest, Coins } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-5xl px-6 py-24">
        <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary">GitGuild · hackathon prototype</p>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">Explore repository tokens and PR prediction markets</h1>
        <p className="mt-7 max-w-2xl text-lg text-muted-foreground">
          GitGuild has two separate smart contract systems: a token for each registered repository and an owner managed YES/NO market for a pull request. Try them on a local Hardhat chain with test ETH.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground">Open dashboard <ArrowRight size={18} /></Link>
          <Link href="https://github.com/Muneer320/GitGuild" className="inline-flex items-center gap-2 rounded-md border px-5 py-3 font-medium"><Github size={18} /> Source code</Link>
        </div>
      </section>
      <section className="container mx-auto grid max-w-5xl gap-5 px-6 pb-24 md:grid-cols-2">
        <article className="rounded-xl border p-7">
          <Coins className="mb-4 text-primary" />
          <h2 className="text-xl font-semibold">Repository tokens</h2>
          <p className="mt-3 text-muted-foreground">Register a GitHub repository, mint its ERC-20 token using ETH, and redeem against ETH held by the token contract. Token holders do not receive automatic PR merge rewards.</p>
        </article>
        <article className="rounded-xl border p-7">
          <GitPullRequest className="mb-4 text-primary" />
          <h2 className="text-xl font-semibold">PR outcome markets</h2>
          <p className="mt-3 text-muted-foreground">The contract owner creates and resolves markets. Wallets can back YES or NO, then claim a proportional share of the pool if their outcome wins. The contract does not verify GitHub outcomes.</p>
        </article>
      </section>
      <p className="container mx-auto max-w-5xl px-6 pb-12 text-sm text-muted-foreground">Prototype for local demonstration. Contracts have not been independently audited. Do not use real funds.</p>
    </main>
  );
}
