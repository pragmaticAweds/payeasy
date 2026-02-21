/**
 * @file page.tsx
 * @description Mobile-first home page with touch-optimized interactions
 */

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4 sm:px-6 lg:px-24 py-12">
      {/* Header Badge */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200  lg:p-4 dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:dark:bg-zinc-800/30">
          PayEasy &nbsp;
          <code className="font-mono font-bold">v0.1.0</code>
        </p>
      </div>

      {/* Hero Section - Mobile-first */}
      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[200px] sm:before:h-[300px] before:w-[320px] sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-transparent before:to-blue-700 before:opacity-10 after:absolute after:-z-20 after:h-[120px] sm:after:h-[180px] after:w-[160px] sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-sky-900 after:via-[#7D00FF] after:opacity-40 after:blur-2xl after:content-[''] before:lg:h-[360px] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-center">
          PayEasy
        </h1>
      </div>

      {/* Tagline - Mobile-optimized */}
      <p className="mt-4 sm:mt-6 max-w-lg px-4 text-center text-base sm:text-xl text-slate-400">
        The secure way to share rent with roommates using the Stellar network.
      </p>

      {/* Action Cards - Mobile-first grid */}
      <div className="mb-16 sm:mb-32 mt-8 sm:mt-12 grid gap-4 sm:gap-6 w-full max-w-5xl px-4 sm:px-0 lg:mb-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/browse"
          className="group rounded-lg border border-transparent px-5 py-6 sm:py-4 transition-all hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 active:scale-[0.98] min-h-touch"
        >
          <h2 className={`mb-3 text-xl sm:text-2xl font-semibold`}>
            Find Listing{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>Browse apartments and roommates.</p>
        </Link>

        <Link
          href="/messages"
          className="group rounded-lg border border-transparent px-5 py-6 sm:py-4 transition-all hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 active:scale-[0.98] min-h-touch"
        >
          <h2 className={`mb-3 text-xl sm:text-2xl font-semibold`}>
            Inbox{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Chat and negotiate with landlords.
          </p>
        </Link>

        <Link
          href="/payment"
          className="group rounded-lg border border-transparent px-5 py-6 sm:py-4 transition-all hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 active:scale-[0.98] min-h-touch sm:col-span-2 lg:col-span-1"
        >
          <h2 className={`mb-3 text-xl sm:text-2xl font-semibold`}>
            Pay Rent{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Securely split payments with Soroban.
          </p>
        </Link>
      </div>
    </main>
  );
}
