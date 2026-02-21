'use client'

import { createContext } from 'react'
import type { FreighterStatus } from '@/lib/stellar/freighter'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface WalletContextValue {
  /** Current wallet status */
  status: FreighterStatus
  /** True until the first probe completes (SSR + first render) */
  isInitializing: boolean
  /** Connected wallet's public key, or null */
  publicKey: string | null
  /** Convenience: true when status === 'connected' and publicKey is set */
  isConnected: boolean
  /** Request Freighter access and connect */
  connect: () => Promise<void>
  /** Disconnect wallet (local only — clears cached state) */
  disconnect: () => void
  /** Manually re-probe Freighter state */
  refreshWalletState: () => Promise<void>
}

// ──────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────

export const WalletContext = createContext<WalletContextValue | undefined>(undefined)

WalletContext.displayName = 'WalletContext'
