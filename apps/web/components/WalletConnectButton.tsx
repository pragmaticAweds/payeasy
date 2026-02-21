'use client'

import { useWallet } from '@/hooks/useWallet'

export default function WalletConnectButton() {
  const { status, isInitializing, publicKey, isConnected, connect, disconnect } = useWallet()

  // Skeleton while probing
  if (isInitializing) {
    return (
      <div className="h-10 w-40 animate-pulse rounded-xl border border-white/10 bg-white/5" />
    )
  }

  // Extension not installed
  if (status === 'not-installed') {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/10"
      >
        <WalletIcon />
        Install Freighter
      </a>
    )
  }

  // Connected — show truncated key + disconnect
  if (isConnected && publicKey) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-mono text-emerald-400">
          {publicKey.slice(0, 6)}…{publicKey.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // Installed but not connected
  return (
    <button
      onClick={connect}
      className="group relative inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/10"
    >
      <span className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      <WalletIcon />
      Connect Wallet
    </button>
  )
}

function WalletIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h3.75A2.25 2.25 0 0021 6V4.5A2.25 2.25 0 0018.75 2.25H5.25A2.25 2.25 0 003 4.5v15A2.25 2.25 0 005.25 21.75h13.5A2.25 2.25 0 0021 19.5V12z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  )
}
