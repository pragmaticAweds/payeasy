'use client'

import { useContext } from 'react'
import { WalletContext } from '@/contexts/WalletContext'

/**
 * Hook for accessing wallet connection state and actions.
 * Must be used within a WalletProvider.
 */
export function useWallet() {
  const context = useContext(WalletContext)

  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }

  return context
}
