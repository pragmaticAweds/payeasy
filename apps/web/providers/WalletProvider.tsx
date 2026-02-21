'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { WalletContext } from '@/contexts/WalletContext'
import {
  probeFreighterStatus,
  requestFreighterAccess,
  getFreighterPublicKey,
  type FreighterStatus,
} from '@/lib/stellar/freighter'

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const WALLET_CACHE_KEY = 'wallet_public_key'
const POLL_INTERVAL_MS = 10_000

// ──────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────

interface WalletProviderProps {
  children: ReactNode
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [status, setStatus] = useState<FreighterStatus>('not-installed')
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Probe helper ────────────────────────────────────────────

  const probe = useCallback(async () => {
    const result = await probeFreighterStatus()
    setStatus(result.status)
    setPublicKey(result.publicKey)

    // Persist / clear cache
    if (result.publicKey) {
      localStorage.setItem(WALLET_CACHE_KEY, result.publicKey)
    } else {
      localStorage.removeItem(WALLET_CACHE_KEY)
    }

    return result
  }, [])

  // ── Initial mount probe ─────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // Use cached key for near-instant hydration
      const cached = localStorage.getItem(WALLET_CACHE_KEY)
      if (cached) {
        setPublicKey(cached)
        setStatus('connected')
      }

      const result = await probeFreighterStatus()

      if (!cancelled) {
        setStatus(result.status)
        setPublicKey(result.publicKey)
        setIsInitializing(false)

        if (result.publicKey) {
          localStorage.setItem(WALLET_CACHE_KEY, result.publicKey)
        } else {
          localStorage.removeItem(WALLET_CACHE_KEY)
        }
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // ── Account-switching poll ──────────────────────────────────

  useEffect(() => {
    if (status !== 'connected') {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }

    const checkForChange = async () => {
      try {
        const currentKey = await getFreighterPublicKey()
        setPublicKey(prev => {
          if (prev !== currentKey) {
            localStorage.setItem(WALLET_CACHE_KEY, currentKey)
            return currentKey
          }
          return prev
        })
      } catch {
        // Extension may have been removed or locked — re-probe
        probe()
      }
    }

    pollRef.current = setInterval(checkForChange, POLL_INTERVAL_MS)

    // Also re-probe when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForChange()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [status, probe])

  // ── Actions ─────────────────────────────────────────────────

  const connect = useCallback(async () => {
    const allowed = await requestFreighterAccess()
    if (!allowed) return

    const key = await getFreighterPublicKey()
    setPublicKey(key)
    setStatus('connected')
    localStorage.setItem(WALLET_CACHE_KEY, key)
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey(null)
    setStatus('installed')
    localStorage.removeItem(WALLET_CACHE_KEY)
  }, [])

  const refreshWalletState = useCallback(async () => {
    await probe()
  }, [probe])

  // ── Render ──────────────────────────────────────────────────

  const value = {
    status,
    isInitializing,
    publicKey,
    isConnected: status === 'connected' && publicKey !== null,
    connect,
    disconnect,
    refreshWalletState,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
